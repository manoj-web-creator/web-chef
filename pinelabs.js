window.populatePinelabsTable = (pinelabsData) => {
    const pinelabsTableBody = document.getElementById('pinelabs-table-body');
    if (!pinelabsTableBody) {
        console.error("Element with ID 'pinelabs-table-body' not found.");
        return;
    }
    pinelabsTableBody.innerHTML = '';

    if (pinelabsData && pinelabsData.length > 0) {
        pinelabsData.forEach(pl => {
            const tr = document.createElement('tr');
            tr.className = 'table-row';
            tr.innerHTML = `
                <td>${pl.mapping_id || pl.main_mapping_id}</td>
                <td>${pl.pos_id || '-'}</td>
                <td>${pl.tid || '-'}</td>
                <td>${pl.serial_no || '-'}</td>
                <td>${pl.store_id || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-icon-only" title="Edit Pine Labs Entry" onclick="window.editPineLabsDetail(${pl.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="btn btn-danger btn-icon-only" title="Delete Pine Labs Entry" onclick="window.deleteSinglePinelabDetail(${pl.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            pinelabsTableBody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted);">No Pine Labs details found for the selected mappings.</td>`;
        pinelabsTableBody.appendChild(tr);
    }
};

window.insertPineLabsDetails = async (mappingId, details) => {
    if (!details || details.length === 0) return;

    const detailsToInsert = details.map(d => ({
        pos_id: d.pos_id || null,
        tid: d.tid || null,
        serial_no: d.serial_no || null,
        store_id: d.store_id || null,
        mapping_id: mappingId
    }));

    const validDetailsToInsert = detailsToInsert.filter(d => d.pos_id || d.tid || d.serial_no || d.store_id);

    if (validDetailsToInsert.length === 0) return;

    const { error } = await supabaseClient.from('pinelabs_details').insert(validDetailsToInsert);
    if (error) {
        console.error('Error inserting Pine Labs details:', error);
        throw new Error(`Failed to insert Pine Labs details: ${error.message}`);
    }
};

window.updatePineLabsDetails = async (mappingId, details) => {
    const { error: deleteError } = await supabaseClient
        .from('pinelabs_details')
        .delete()
        .eq('mapping_id', mappingId);

    if (deleteError) {
        console.error('Error deleting old Pine Labs details:', deleteError);
        throw new Error(`Failed to update Pine Labs details (delete step): ${deleteError.message}`);
    }

    if (details && details.length > 0) {
        const validDetails = details.filter(d => d.pos_id || d.tid || d.serial_no || d.store_id);
        if (validDetails.length > 0) {
            await window.insertPineLabsDetails(mappingId, validDetails);
        }
    }
};

window.deleteSinglePinelabDetail = async (detailId) => {
    if (!confirm('Are you sure you want to delete this Pine Labs entry? This action cannot be undone.')) {
        return;
    }
    try {
        const { error } = await supabaseClient.from('pinelabs_details').delete().eq('id', detailId);
        if (error) throw error;
        window.showToast('Pine Labs entry deleted successfully!', 'success');
        if (typeof window.loadMappings === 'function') {
            window.loadMappings();
        }
    } catch (err) {
        window.showToast('Error deleting Pine Labs entry: ' + err.message, 'error');
    }
};

window.editPineLabsDetail = async (detailId) => {
    try {
        const { data: pinelabsDetail, error } = await supabaseClient
            .from('pinelabs_details')
            .select('*')
            .eq('id', detailId)
            .single();

        if (error) throw error;
        if (!pinelabsDetail) {
             window.showToast('Pine Labs entry not found.', 'error');
             return;
        }

         const { data: parentMapping, error: mappingError } = await supabaseClient
             .from('finance_mappings')
             .select('*, pinelabs_details(*)')
             .eq('id', pinelabsDetail.mapping_id)
             .single();

        if (mappingError) throw mappingError;


        pinelabsTab.click();

        pinelabsEntriesContainer.innerHTML = '';

         pinelabsEntriesContainer.insertAdjacentHTML('beforeend', createPinelabsEntryHtml(
            pinelabsDetail.pos_id || '',
            pinelabsDetail.tid || '',
            pinelabsDetail.serial_no || '',
            pinelabsDetail.store_id || ''
         ));

         const entryDiv = pinelabsEntriesContainer.querySelector('.pinelabs-entry');
          if (entryDiv && !entryDiv.querySelector('.remove-pinelabs-entry')) {
             const removeBtnHtml = `<div><button type="button" class="btn btn-danger btn-icon-only remove-pinelabs-entry" title="Remove Entry" style="align-self: end;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>`;
              entryDiv.insertAdjacentHTML('beforeend', removeBtnHtml);
          }

         window.populateFormForEdit(parentMapping);

        window.showToast('Editing Pine Labs entry.', 'info');
         window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        window.showToast('Error fetching Pine Labs entry for edit: ' + err.message, 'error');
        console.error("Error in editPineLabsDetail:", err);
    }
};