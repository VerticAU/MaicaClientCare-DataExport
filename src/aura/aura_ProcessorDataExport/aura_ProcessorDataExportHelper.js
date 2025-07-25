({
    executePromise: function (cmp, processor, request) {
        let that = this;
        console.log(processor, 'REQUEST', JSON.parse(JSON.stringify(request)));

        return that.callApexPromise(
            cmp.get('c.execute'),
            {
                processor: processor,
                requestJSON: JSON.stringify(request)
            }
        )
            .then($A.getCallback(responseJSON => {
                let response = JSON.parse(responseJSON);
                if (response.isValid !== true) {
                    console.error(response.errors);
                    return Promise.reject(response.errors);
                } else {
                    console.log(processor, 'RESPONSE', JSON.parse(JSON.stringify(response)));
                    return Promise.resolve(response);
                }
            }));
    },

    callApexPromise: function (action, params) {
        return new Promise((resolve, reject) => {
            action.setParams(params);
            action.setCallback(this, response => {
                let state = response.getState();
                if (state === "SUCCESS") {
                    let retVal = response.getReturnValue();
                    return resolve(retVal);
                } else if (state === "ERROR") {
                    let errors = response.getError();
                    if (errors && errors.length && errors[0] && errors[0].message) {
                        return reject(new Error(errors[0].message));
                    } else {
                        return reject(new Error("Unknown error!"));
                    }
                }
            });
            $A.enqueueAction(action);
        });
    },

    showErrors: function (cmp, errors) {
        let isShowErrors = cmp.get('v.isShowErrors');
        let errorMessages = cmp.find('errorMessages');

        if (isShowErrors) {
            errorMessages.showErrors(errors || [], true);
        }
    },

    validateContent: function (cmp) {
        let validationResult = {allValid: true};
        let isValidatable = cmp.get('v.isValidatable');
        let errorMessages = cmp.find('errorMessages');
        errorMessages.clearErrors();

        if (isValidatable) {
            validationResult = this.validate(cmp.find('content'));
            if (validationResult.allValid !== true) {
                this.showErrors(cmp, validationResult.getErrorMessages());
            }
        }

        return validationResult;
    },

    validate: function (containerComponent, options) {

        options = options || {}
        options.additionalComponentTypes = options.additionalComponentTypes || [];

        var componentTypes = [
            'lightning:input',
            'lightning:select',
            'lightning:textarea',
            'lightning:radioGroup',
            'lightning:checkboxGroup',
            'c:vertic_Validity',
            'c:vertic_Lookup',
            'c:vertic_MultiSelect'
        ];
        var inputComponents = [];

        componentTypes = componentTypes.concat(options.additionalComponentTypes);

        componentTypes.forEach(function (componentType) {
            inputComponents = inputComponents.concat(containerComponent.find({instancesOf: componentType}));
        });

        return this.validateComponents(inputComponents);
    },

    validateComponents: function (components) {
        var validationResult = {
            errorsByInputs: [],
            allValid: true,
            getErrorMessages: function () {
                var errors = [];
                this.errorsByInputs.forEach(function (errorsByInput) {
                    errors.push(errorsByInput.errors.join(','));
                })

                return errors;
            }
        };

        components.forEach(function (inputCmp) {

            var validationErrors = [
                'badInput',
                'customError',
                'patternMismatch',
                'rangeOverflow',
                'rangeUnderflow',
                'stepMismatch',
                'tooLong',
                'tooShort',
                'typeMismatch',
                'valueMissing'
            ];

            var defaultErrorMessages = {
                badInput: 'Enter a valid value.',
                patternMismatch: 'Your entry does not match the allowed pattern.',
                rangeOverflow: 'The number is too high.',
                rangeUnderflow: 'The number is too low.',
                stepMismatch: 'Your entry isn\'t a valid increment.',
                tooLong: 'Your entry is too long.',
                tooShort: 'Your entry is too short.',
                typeMismatch: 'You have entered an invalid format.',
                valueMissing: 'Complete this field.'
            };


            var capitalizeFirstLetter = function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            if (inputCmp) {

                var validity;
                if (inputCmp && inputCmp.getType && inputCmp.getType() == 'c:vertic_Lookup') {
                    // Do no get validity from custom components.
                } else {
                    try {
                        validity = inputCmp.get('v.validity');
                    } catch (e) {
                    }
                }


                if (validity == undefined) {

                    if (inputCmp.getConcreteComponent) {
                        inputCmp = inputCmp.getConcreteComponent();
                    }

                    var hasShowErrorMethod = inputCmp.get('c.showError') != undefined;
                    var hasHideErrorMethod = inputCmp.get('c.hideError') != undefined;
                    if (hasShowErrorMethod == true) {

                        var isRequired = inputCmp.get('v.required');
                        var hasError = inputCmp.get('v.error');
                        var errorMessage = inputCmp.get('v.errorMessage');
                        var isEmptyValue = $A.util.isEmpty(inputCmp.get('v.value'));

                        if (isRequired && isEmptyValue) {

                            inputCmp.showError('Complete this field.');

                            validationResult.errorsByInputs.push({
                                inputCmp: inputCmp,
                                errors: [
                                    inputCmp.get('v.label') + ': Complete this field.'
                                ]
                            });

                            validationResult.allValid = false;
                        } else if (hasError && errorMessage && errorMessage != 'Complete this field.') {
                            validationResult.errorsByInputs.push({
                                inputCmp: inputCmp,
                                errors: [
                                    inputCmp.get('v.label') + ': ' + errorMessage
                                ]
                            });

                            validationResult.allValid = false;
                        } else if (hasHideErrorMethod == true) {
                            inputCmp.hideError();
                        }
                    }

                } else if (validity && validity.valid == false) {

                    var errors = [];
                    validationErrors.forEach(function (validationErrorField) {
                        if (validity[validationErrorField] == true) {
                            var errorMessageField = 'v.messageWhen' + capitalizeFirstLetter(validationErrorField);
                            var errorMessage = inputCmp.get(errorMessageField);
                            errorMessage = errorMessage || defaultErrorMessages[validationErrorField];
                            if (errorMessage) {
                                errors.push(inputCmp.get('v.label') + ': ' + errorMessage);
                            } else {
                                errors.push(inputCmp.get('v.label') + ': ' + (
                                    ($A.util.isEmpty(inputCmp.get('v.value')) ? inputCmp.get('v.messageWhenValueMissing') : inputCmp.get('v.messageWhenBadInput')) || inputCmp.get('v.label'))
                                );
                            }
                        }
                    })

                    validationResult.errorsByInputs.push({
                        inputCmp: inputCmp,
                        errors: errors
                    });

                    validationResult.allValid = false;

                    // debugger

                    if (inputCmp.reportValidity != undefined) {
                        inputCmp.reportValidity();
                    } else if (inputCmp.showHelpMessageIfInvalid != undefined) {
                        inputCmp.showHelpMessageIfInvalid();
                    }

                }

            }
        })

        return validationResult;
    },

    deepMerge: function (target, source) {
        if (typeof target !== 'object' || typeof source !== 'object') return false;
        for (var prop in source) {
            if (!source.hasOwnProperty(prop)) continue;
            if (!target) {
                target = source;
            } else if (target && prop in target) {
                if (typeof target[prop] !== 'object') {
                    target[prop] = source[prop];
                } else {
                    if (typeof source[prop] !== 'object') {
                        target[prop] = source[prop];
                    } else {
                        if (Array.isArray(target[prop]) && Array.isArray(source[prop])) {
                            target[prop] = target[prop].concat(source[prop]);
                        } else {
                            target[prop] = this.deepMerge(target[prop], source[prop]);
                        }
                    }
                }
            } else {
                target[prop] = source[prop];
            }
        }
        return target;
    }
});