({
    handleInit: function (cmp, event, helper) {
        let soql = 'SELECT Id, NamespacePrefix, Label, DeveloperName FROM Data_Export_Setting__mdt WHERE Is_Active__c = TRUE';

        cmp.find('DataExportInit')
            .init('SOQLProc',
                {
                    'SOQL': soql
                }
            )
            .then(response => {
                let options = response.dto.records.map(function (record) {
                    let settingName = record.DeveloperName;
                    return {
                        value: settingName,
                        label: (record.NamespacePrefix ? '(' + record.NamespacePrefix + ') ' : '') + record.Label
                    }
                });

                cmp.set('v.meta.selectOptions.exportSettingOptions', options);
            })
            .catch(response => {
                let error = typeof response === 'string' ? response : response.message;
                cmp.find('notifLib').showToast({
                    variant: 'error',
                    message: error
                });
            })
    },

    handleSettingChange: function (cmp, event, helper) {
        let exportSettingName = cmp.get('v.exportSettingName');
        cmp.set('v.payload', {});
        cmp.set('v.meta.getResponse', null);

        if (exportSettingName) {
            new Promise((resolve, reject) => {
                cmp.set('v.isLoading', true);
                $A.createComponent(
                    "c:Export" + exportSettingName,
                    {
                        "aura:id": 'exportCmp',
                        payload: cmp.get('v.payload'),
                        exportSettingName: exportSettingName,
                        onFilterChange: cmp.getReference('c.handleFilterChange'),
                    },
                    function (newCmp, status, errorMessage) {
                        cmp.set('v.isLoading', false);
                        if (status === "SUCCESS") {
                            cmp.set('v.exportCmp', newCmp);
                            resolve();

                        } else if (status === "INCOMPLETE") {
                            reject('No response from server or client is offline.');

                        } else if (status === "ERROR") {
                            reject(errorMessage);
                        }
                    }
                )
            })
                .catch(errorMessage => {
                    cmp.set('v.exportCmp', null);
                    cmp.find('notifLib').showToast({
                        variant: 'error',
                        message: errorMessage
                    });
                })
        }
    },

    handleFilterChange: function (cmp, event, helper) {
        let payload = event.getParam('payload') || {};

        cmp.find('ExportGetProc')
            .process('DataExportCommonHandler',
                {
                    action: 'get',
                    payload: payload,
                    exportSettingName: cmp.get('v.exportSettingName'),
                }
            )
            .then(response => {
                cmp.set('v.payload', response.dto.payload);
                let exportCmps = cmp.find('exportCmp') || [];
                exportCmps = !$A.util.isArray(exportCmps) ? [exportCmps] : exportCmps;
                exportCmps[exportCmps.length - 1].set('v.payload', response.dto.payload);
            })
            .catch(response => {
                let error = typeof response === 'string' ? response : response.message;
                cmp.find('notifLib').showToast({
                    variant: 'error',
                    message: error
                });
            });
    },

    handleChunkButtonClick: function (cmp, event, helper) {
        let chunk = event.getSource().get('v.value');
        let chunkIndex = 0;
        let chunkProcesses = cmp.find('ChunkProc') || [];
        chunkProcesses = !$A.util.isArray(chunkProcesses) ? [chunkProcesses] : chunkProcesses;

        let proc = chunkProcesses.find((proc, index )=> {
            if(proc.get('v.uniqueId') === chunk.startIndex){
                chunkIndex = index;
            }
            return proc.get('v.uniqueId') === chunk.startIndex
        });

        proc
            .process('DataExportCommonHandler', {
                action: 'export',
                payload: chunk.payload,
                exportSettingName: cmp.get('v.exportSettingName'),
                chunkIndex: chunkIndex +1,
            })
            .then(response => {
                let fileId = response.dto.fileId;

                if (!fileId) {
                    return Promise.reject({dto: {error: 'File was not created.'}});
                }

                cmp.find('notifLib').showToast({
                    variant: 'success',
                    message: 'Data export completed successfully.'
                });

                $A.get('e.lightning:openFiles').fire({
                    recordIds: [response.dto.fileId]
                });

                return Promise.resolve();
            })
            .catch(response => {
                let error = typeof response === 'string' ? response : response.message;
                cmp.find('notifLib').showToast({
                    variant: 'error',
                    message: error
                });
            });
    },
})