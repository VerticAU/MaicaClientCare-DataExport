({
    handleInit: function (cmp, event, helper) {
        cmp.set('v.isShowErrors', cmp.get('v.isValidatable') && (cmp.get('v.isShowErrors') === null || cmp.get('v.isShowErrors') === undefined))

        if (cmp.get('v.pending').length) cmp.set('v.isShowPending', true);

        if (cmp.get('v.initProcessor')){
            $A.enqueueAction(cmp.get('c.handleInitProc'));
        } else if(cmp.getEvent("onInit")){
            cmp.getEvent("onInit").fire();
        }
    },

    handleInitProc: function (cmp, event, helper) {
        let proc = event ? event.getParams().arguments.processor : cmp.get('v.initProcessor');
        let request = event ? event.getParams().arguments.request : {recordId: cmp.get('v.recordId')};

        if (cmp.get('v.isShowPending')) cmp.set('v.stage', 'pending');

        cmp.set('v.isLoading', true);
        return helper
            .executePromise(cmp, proc, request)
            .then(response => {
                cmp.set('v.response', response);
                return Promise.resolve(response);
            })
            .catch(errors => {
                errors = Array.isArray(errors) ? errors : [errors]
                let response = {dto: {isValid: false, errors: errors, error: errors[0].message}, message: errors[0].message};
                cmp.get('v.isShowFailure') ? cmp.set('v.stage', 'failure') : cmp.set('v.stage', 'initial');
                cmp.set('v.response', response);
                helper.showErrors(cmp, errors);
                return Promise.reject(response);
            })
            .finally(() => {
                cmp.set('v.isLoading', false);
            });
    },

    handleSubmitProc: function (cmp, event, helper) {
        let validationResult = helper.validateContent(cmp);
        let proc = event ? event.getParams().arguments.processor : cmp.get('v.submitProcessor');
        let request =  event ? event.getParams().arguments.request : {};
        let isMergeResponse =  event ? event.getParams().arguments.isMergeResponse : false;

        if (!validationResult.allValid) return Promise.reject({dto: {errors: validationResult.getErrorMessages(), error: validationResult.getErrorMessages()[0].message}, isValid: false});
        if (cmp.get('v.isShowPending')) cmp.set('v.stage', 'pending');

        cmp.set('v.isLoading', true);
        return helper
            .executePromise(cmp, proc, request)
            .then(response => {
                cmp.get('v.success').length ? cmp.set('v.stage', 'success') : cmp.set('v.stage', 'initial');
                let currentResponse = cmp.get('v.response') || {};
                cmp.set('v.response', isMergeResponse ? helper.deepMerge(currentResponse, response) : response);
                return Promise.resolve(response);

            })
            .catch(errors => {
                errors = Array.isArray(errors) ? errors : [errors];
                let response = {dto: {isValid: false, errors: errors, error: errors[0].message}, message: errors[0].message};
                let currentResponse = cmp.get('v.response') || {};
                cmp.set('v.response', isMergeResponse ? helper.deepMerge(currentResponse, response) : response);
                cmp.set('v.stage', cmp.get('v.isShowFailure') ? 'failure' : 'initial');
                helper.showErrors(cmp, errors);
                return Promise.reject(response);
            })
            .finally(() => {
                cmp.set('v.isLoading', false);
            });
    },

    handleSetStage: function (cmp, event, helper) {
        cmp.set('v.stage', event.getParams().arguments.stage);
    },

    handleValidate: function (cmp, event, helper) {
        return helper.validateContent(cmp);
    },

    handleCloseClick: function (cmp, event, helper) {
        cmp.set('v.stage', 'initial');
    },

    handleReload: function (cmp, event, helper) {
        cmp.set('v.isReloading', true);
        cmp.set('v.isReloading', false);
    },
});