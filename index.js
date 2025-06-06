const appContainer = document.getElementById('app-container');
const storeSelect = document.getElementById('store-name');
const logoutBtn = document.getElementById('logout-btn');
const mappingForm = document.getElementById('mapping-form');
const mappingIdInput = document.getElementById('mapping-id');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitLoading = document.getElementById('submit-loading');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const brandSelect = document.getElementById('brand');
const financierSelect = document.getElementById('financier');
const appleCodeSection = document.getElementById('apple-code-section');
const pinelabsSection = document.getElementById('pinelabs-section');
const financiersSection = document.getElementById('financiers-section');
const financierTab = document.getElementById('financier-tab');
const pinelabsTab = document.getElementById('pinelabs-tab');
const activeTabInput = document.getElementById('active-tab');
const addPinelabsBtn = document.getElementById('add-pinelabs');
const pinelabsEntriesContainer = document.getElementById('pinelabs-entries');
const downloadExcelBtn = document.getElementById('download-excel');

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        appContainer.classList.remove('hidden');
        initializeApp();
        if (activeTabInput.value === 'pinelabs') {
            financierSelect.removeAttribute('required');
        } else {
            financierSelect.setAttribute('required', 'true');
        }
    }
});

async function initializeApp() {
    if (typeof XLSX === 'undefined') { window.showToast('Excel export unavailable. Check network or library.', 'error'); }
    await loadUserStores();
    if (storeSelect.options.length > 1) {
        loadMappings();
        financierSelect.setAttribute('required', 'true');
         if (pinelabsEntriesContainer) {
             pinelabsEntriesContainer.innerHTML = window.createPinelabsEntryHtml();
         }
    } else {
        document.getElementById('form-section').style.display = 'none';
        window.showToast('No stores assigned to your account. Contact admin.', 'error');
    }
}

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});

async function loadUserStores() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Not authenticated.');
        const { data, error } = await supabaseClient.from('user_stores').select('store_name').eq('user_id', user.id);
        if (error) throw new Error('Failed to load stores: ' + error.message);
        storeSelect.innerHTML = '<option value="">Select Store</option>';
        data.forEach(store => {
            const option = document.createElement('option');
            option.value = store.store_name;
            option.textContent = store.store_name;
            storeSelect.appendChild(option);
        });
    } catch (err) { window.showToast(err.message, 'error'); }
}

financierTab.addEventListener('click', () => {
    financierTab.classList.add('active');
    pinelabsTab.classList.remove('active');
    financiersSection.classList.remove('hidden');
    pinelabsSection.classList.add('hidden');
    activeTabInput.value = 'financier';
    financierSelect.setAttribute('required', 'true');
     if (pinelabsEntriesContainer) {
         Array.from(pinelabsEntriesContainer.querySelectorAll('input')).forEach(input => input.value = '');
     }
     hideFinancierCodeSections();
});

pinelabsTab.addEventListener('click', () => {
    pinelabsTab.classList.add('active');
    financierTab.classList.remove('active');
    pinelabsSection.classList.remove('hidden');
    financiersSection.classList.add('hidden');
    activeTabInput.value = 'pinelabs';
    financierSelect.removeAttribute('required');
    financierSelect.value = '';
    hideFinancierCodeSections();
     if (pinelabsEntriesContainer.children.length === 0) {
         pinelabsEntriesContainer.insertAdjacentHTML('beforeend', window.createPinelabsEntryHtml());
     }
});

brandSelect.addEventListener('change', () => {
    appleCodeSection.classList.toggle('hidden', brandSelect.value !== 'Apple');
    if (brandSelect.value !== 'Apple') document.getElementById('apple-code').value = '';
});

const financierCodeSections = {
    'Bajaj': 'bajaj-code-section', 'IDFC': 'idfc-code-section', 'HDFC': 'hdfc-code-section',
    'HDB': 'hdb-code-section', 'TVS': 'tvs-code-section', 'Benow': 'benow-code-section',
    'ICICI': 'icici-code-section', 'Home Credit': 'home-credit-code-section', 'Kotak': 'kotak-code-section'
};

function hideFinancierCodeSections() {
    Object.values(financierCodeSections).forEach(id => {
        const section = document.getElementById(id);
        if (section) section.classList.add('hidden');
        const input = document.getElementById(id.replace('-section', ''));
        if (input) input.value = '';
    });
}

financierSelect.addEventListener('change', () => {
    hideFinancierCodeSections();
    const selectedFinancier = financierSelect.value;
    const sectionId = financierCodeSections[selectedFinancier];
    if (sectionId && document.getElementById(sectionId)) {
        document.getElementById(sectionId).classList.remove('hidden');
    }
});

window.createPinelabsEntryHtml = (pos_id = '', tid = '', serial_no = '', store_id = '') => {
     const isRemoveBtnVisible = pinelabsEntriesContainer ? pinelabsEntriesContainer.children.length > 0 : false;

     return `
         <div class="pinelabs-entry grid-cols-1-md-4">
             <div><label class="hidden md:block">POS ID</label><input type="text" name="pos_id" placeholder="POS ID" class="form-control pinelabs-pos-id" value="${pos_id}"></div>
             <div><label class="hidden md:block">TID</label><input type="text" name="tid" placeholder="TID" class="form-control pinelabs-tid" value="${tid}"></div>
             <div><label class="hidden md:block">Serial No</label><input type="text" name="serial_no" placeholder="Serial No" class="form-control pinelabs-serial-no" value="${serial_no}"></div>
             <div><label class="hidden md:block">Store ID</label><input type="text" name="store_id" placeholder="Store ID" class="form-control pinelabs-store-id" value="${store_id}"></div>
             ${isRemoveBtnVisible ? `<div><button type="button" class="btn btn-danger btn-icon-only remove-pinelabs-entry" title="Remove Entry" style="align-self: end;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>` : '<div></div>'}
         </div>
     `;
 };
 if (pinelabsEntriesContainer) {
     pinelabsEntriesContainer.innerHTML = window.createPinelabsEntryHtml();
 }

addPinelabsBtn.addEventListener('click', () => {
    if (pinelabsEntriesContainer.children.length >= 3) {
        window.showToast('Maximum 3 Pine Labs entries allowed.', 'error');
        return;
    }
    Array.from(pinelabsEntriesContainer.children).forEach(entryDiv => {
        if (!entryDiv.querySelector('.remove-pinelabs-entry')) {
            const removeBtnHtml = `<div><button type="button" class="btn btn-danger btn-icon-only remove-pinelabs-entry" title="Remove Entry" style="align-self: end;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>`;
            entryDiv.insertAdjacentHTML('beforeend', removeBtnHtml);
        }
    });
    pinelabsEntriesContainer.insertAdjacentHTML('beforeend', window.createPinelabsEntryHtml());
});

pinelabsEntriesContainer.addEventListener('click', (e) => {
    if (e.target.closest('.remove-pinelabs-entry')) {
        const entryDiv = e.target.closest('.pinelabs-entry');
         if (pinelabsEntriesContainer.children.length <= 1) {
             window.showToast('You must have at least one Pine Labs entry field.', 'error');
             return;
         }
        entryDiv.remove();
         if (pinelabsEntriesContainer.children.length === 1) {
             const remainingEntryDiv = pinelabsEntriesContainer.children[0];
             const removeBtnParentDiv = remainingEntryDiv.querySelector('.remove-pinelabs-entry')?.closest('div');
              if (removeBtnParentDiv) {
                 removeBtnParentDiv.remove();
              }
         }
    }
});

mappingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Please log in to submit.');

        const id = mappingIdInput.value;
        const storeName = document.getElementById('store-name').value;
        const brand = document.getElementById('brand').value;
        const appleCode = document.getElementById('apple-code').value.trim() || null;
        const activeTab = activeTabInput.value;
        const state = document.getElementById('state').value;
        const requestedBy = document.getElementById('requested-by').value;
        const asmName = document.getElementById('asm-name').value;
        const mailId = document.getElementById('mail-id').value;

        if (!storeName || !brand || !state || !requestedBy || !asmName || !mailId) {
             throw new Error('Please fill in all required fields.');
        }

        let financier = null;
        let mainFinancierCode = null;
        let pineLabsDetails = [];
        let mappingData = {};

        if (activeTab === 'financier') {
            financier = financierSelect.value;
            if (!financier) {
                 throw new Error('Please select a Financier.');
            }
            const codeInput = document.getElementById(financierCodeSections[financier]?.replace('-section', ''));
            mainFinancierCode = codeInput ? codeInput.value.trim() || null : null;

             mappingData = {
                store_name: storeName,
                asm: asmName,
                mail_id: mailId,
                brand,
                brand_code: appleCode,
                state,
                requested_by: requestedBy,
                user_id: user.id,
                requested_date: new Date().toISOString(),
                financier: financier,
                financier_code: mainFinancierCode
            };


        } else if (activeTab === 'pinelabs') {
            financier = 'Pine Labs';
            mainFinancierCode = null;

             pineLabsDetails = Array.from(document.querySelectorAll('.pinelabs-entry')).map(entry => {
                return {
                    pos_id: entry.querySelector('.pinelabs-pos-id').value.trim() || null,
                    tid: entry.querySelector('.pinelabs-tid').value.trim() || null,
                    serial_no: entry.querySelector('.pinelabs-serial-no').value.trim() || null,
                    store_id: entry.querySelector('.pinelabs-store-id').value.trim() || null
                };
            });

            const validPineLabsDetails = pineLabsDetails.filter(pl => pl.pos_id || pl.tid || pl.serial_no || pl.store_id);

             if (validPineLabsDetails.length === 0 && !id) {
                 throw new Error('Please fill in at least one detail (POS ID, TID, Serial No, or Store ID) for at least one Pine Labs entry.');
             }
             pineLabsDetails = validPineLabsDetails;

             mappingData = {
                store_name: storeName,
                asm: asmName,
                mail_id: mailId,
                brand,
                brand_code: appleCode,
                state,
                requested_by: requestedBy,
                user_id: user.id,
                requested_date: new Date().toISOString(),
                financier: financier,
                financier_code: mainFinancierCode
            };
        }


        let financeMappingResponse;
        if (id) {
            financeMappingResponse = await supabaseClient.from('finance_mappings').update(mappingData).eq('id', id).select().single();
            if (financeMappingResponse.error) throw financeMappingResponse.error;

             if (activeTab === 'pinelabs' && typeof window.updatePineLabsDetails === 'function') {
                await window.updatePineLabsDetails(financeMappingResponse.data.id, pineLabsDetails);
             } else if (activeTab === 'financier' && typeof window.updatePineLabsDetails === 'function') {
                 await window.updatePineLabsDetails(financeMappingResponse.data.id, []);
             }

            window.showToast('Mapping updated successfully!', 'success');

        } else {
            financeMappingResponse = await supabaseClient.from('finance_mappings').insert([mappingData]).select().single();
            if (financeMappingResponse.error) throw financeMappingResponse.error;

            if (activeTab === 'pinelabs' && typeof window.insertPineLabsDetails === 'function') {
                await window.insertPineLabsDetails(financeMappingResponse.data.id, pineLabsDetails);
            }
            window.showToast('Mapping request submitted successfully!', 'success');
        }

        resetForm();
        loadMappings();
    } catch (err) {
        window.showToast(err.message || 'An unexpected error occurred during submission.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
    }
});

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    mappingForm.reset();
    mappingIdInput.value = '';
    submitText.textContent = 'Submit Mapping Request';
    cancelEditBtn.classList.add('hidden');
    appleCodeSection.classList.add('hidden');
    hideFinancierCodeSections();
    financierTab.click();
     if (pinelabsEntriesContainer) {
         pinelabsEntriesContainer.innerHTML = createPinelabsEntryHtml();
     }
}

window.loadMappings = async () => {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: userStores } = await supabaseClient.from('user_stores').select('store_name').eq('user_id', user.id);
        const storeNames = userStores.map(s => s.store_name);

        const { data: financeMappings, error: financeError } = await supabaseClient
            .from('finance_mappings')
            .select('*, pinelabs_details(*)')
            .in('store_name', storeNames)
            .order('id', { ascending: false });

        if (financeError) {
            console.error("Supabase error details:", financeError);
            throw financeError;
        }

        const mainTableBody = document.getElementById('mapping-table-body');
        mainTableBody.innerHTML = '';

        let allPinelabsDetails = [];

        if (financeMappings && financeMappings.length > 0) {
            financeMappings.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = 'table-row';
                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${row.store_name}</td>
                    <td>${row.asm}</td>
                    <td>${row.mail_id}</td>
                    <td>${row.brand}</td>
                    <td>${row.brand_code || '-'}</td>
                    <td>${row.financier}</td>
                    <td>${row.financier !== 'Pine Labs' ? (row.financier_code || '-') : '-'}</td>
                    <td>${new Date(row.requested_date).toLocaleDateString()}</td>
                    <td>${row.requested_by}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-info btn-icon-only" onclick="window.editMapping(${row.id})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button class="btn btn-danger btn-icon-only" onclick="window.deleteMapping(${row.id})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                mainTableBody.appendChild(tr);

                if (row.pinelabs_details && row.pinelabs_details.length > 0) {
                    row.pinelabs_details.forEach(pl => {
                         allPinelabsDetails.push({ ...pl, main_mapping_id: row.id });
                    });
                }
            });
        } else {
             const tr = document.createElement('tr');
             tr.className = 'table-row';
             tr.innerHTML = `<td colspan="11" style="text-align: center; color: var(--text-muted);">No mapping requests found for your stores.</td>`;
             mainTableBody.appendChild(tr);
        }

        if (typeof window.populatePinelabsTable === 'function') {
            window.populatePinelabsTable(allPinelabsDetails);
        } else {
            console.error("populatePinelabsTable function is not defined. Check pinelabs.js.");
        }

    } catch (err) {
        window.showToast('Failed to load mappings: ' + err.message, 'error');
        console.error("Error in loadMappings:", err);
    }
};

window.populateFormForEdit = async (data) => {
    mappingIdInput.value = data.id;
    document.getElementById('store-name').value = data.store_name;
    document.getElementById('brand').value = data.brand;
    document.getElementById('asm-name').value = data.asm;
    document.getElementById('mail-id').value = data.mail_id;
    document.getElementById('state').value = data.state;
    document.getElementById('requested-by').value = data.requested_by;

    if (data.brand === 'Apple') {
        appleCodeSection.classList.remove('hidden');
        document.getElementById('apple-code').value = data.brand_code || '';
    } else {
        appleCodeSection.classList.add('hidden');
        document.getElementById('apple-code').value = '';
    }

    if (data.financier === 'Pine Labs') {
        pinelabsTab.click();
        pinelabsEntriesContainer.innerHTML = '';
        if (data.pinelabs_details && data.pinelabs_details.length > 0) {
            data.pinelabs_details.forEach(entry => {
                pinelabsEntriesContainer.insertAdjacentHTML('beforeend', createPinelabsEntryHtml(entry.pos_id, entry.tid, entry.serial_no, entry.store_id));
            });
        }
        if (pinelabsEntriesContainer.children.length === 0) {
             pinelabsEntriesContainer.insertAdjacentHTML('beforeend', createPinelabsEntryHtml());
        } else if (pinelabsEntriesContainer.children.length === 1) {
             const remainingEntryDiv = pinelabsEntriesContainer.children[0];
             const removeBtnParentDiv = remainingEntryDiv.querySelector('.remove-pinelabs-entry')?.closest('div');
              if (removeBtnParentDiv) {
                 removeBtnParentDiv.remove();
              }
        }


    } else {
        financierTab.click();
        financierSelect.value = data.financier;
        hideFinancierCodeSections();
        const codeInputId = financierCodeSections[data.financier];
        if (codeInputId && document.getElementById(codeInputId)) {
            document.getElementById(codeInputId).classList.remove('hidden');
            document.getElementById(codeInputId.replace('-section', '')).value = data.financier_code || '';
        }
         if (pinelabsEntriesContainer) {
             pinelabsEntriesContainer.innerHTML = createPinelabsEntryHtml();
         }
    }

    submitText.textContent = 'Update Mapping Request';
    cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.editMapping = async (id) => {
    const { data, error } = await supabaseClient.from('finance_mappings').select('*, pinelabs_details(*)').eq('id', id).single();
    if (error) {
        window.showToast('Error fetching data for edit: ' + error.message, 'error');
        return;
    }
    window.populateFormForEdit(data);
};

window.deleteMapping = async (id) => {
    if (!confirm('Are you sure you want to delete this mapping request? This will also delete all associated Pine Labs details (if cascade delete is set up). This action cannot be undone.')) {
        return;
    }
    try {
        const { error } = await supabaseClient.from('finance_mappings').delete().eq('id', id);
        if (error) throw error;
        window.showToast('Mapping and associated Pine Labs details deleted successfully!', 'success');
        loadMappings();
    } catch (err) {
        window.showToast('Error deleting mapping: ' + err.message, 'error');
    }
};

downloadExcelBtn.addEventListener('click', () => {
    try {
        if (typeof XLSX === 'undefined') { throw new Error('Excel library not loaded.'); }
        const workbook = XLSX.utils.book_new();

        const mainTable = document.getElementById('mapping-table');
        // Exclude the last column (Actions) for the main table
        const mainSheet = XLSX.utils.table_to_sheet(mainTable, {raw: true, skip_cols: [10]}); // 10 is the index of the 11th column (0-indexed)
        XLSX.utils.book_append_sheet(workbook, mainSheet, 'Main Mappings');

        const pinelabsTable = document.getElementById('pinelabs-table');
        // Exclude the last column (Actions) for the Pine Labs table
        const pinelabsSheet = XLSX.utils.table_to_sheet(pinelabsTable, {raw: true, skip_cols: [5]}); // 5 is the index of the 6th column (0-indexed)
        XLSX.utils.book_append_sheet(workbook, pinelabsSheet, 'Pine Labs Details');

        XLSX.writeFile(workbook, `Mapping_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);
        window.showToast('Tables exported successfully!', 'success');
    } catch (err) { window.showToast('Failed to export: ' + err.message, 'error'); }
});