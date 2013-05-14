/*! obs-model-validation 0.3.0 Copyright (c) 2013 Alan Plum. MIT licensed. @preserve */
define(function(require, exports, module) {
function optionallyRequire(name, fallback) {
    try {
        return require(name);
    } catch(e) {
        return fallback;
    }
}


var aug = require('aug'),
    equals = require('equals'),
    obs = require('obs'),
    XRegExp = optionallyRequire('xregexp', RegExp),
    isArray = Array.isArray ? Array.isArray : function(arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    };

if (XRegExp.XRegExp) {
    // xregexp < 3.0
    XRegExp = XRegExp.XRegExp;
}


function validation(model) {
    var props = [],
        key, dfn, prop;

    model.valid = obs.computed(function() {
        for (var key in model.model.attrs) {
            if (!model[key].valid()) {
                return false;
            }
        }
        return true;
    });

    for (key in model.model.attrs) {
        dfn = model.model.attrs[key] || {};

        prop = model[key];
        prop.valid = obs.computed({
            read: validation.createValidator(dfn, prop),
            context: model
        });

        prop.valid.watch(prop);
        model.valid.watch(prop.valid);
        props.push(prop);
    }

    for (key in model.model.validations) {
        dfn = model.model.validations[key];
        for (var i = 0; i < dfn.props.length; i++) {
            prop = model[dfn.props[i]];
            prop.valid.read.validations.push(
                validation.createModelValidation(dfn, model)
            );
            for (var j = 0; j < dfn.props.length; j++) {
                if (i === j) {
                    continue;
                }
                prop.valid.watch(model[dfn.props[j]]);
            }
        }
    }

    for (key in model.model.attrs) {
        model[key].notify();
    }

    model._destructors.push(function() {
        var i, prop, key, dfn, j;
        for (i = 0; i < props.length; i++) {
            prop = props[i];
            prop.valid.unwatch(prop);
            model.valid.unwatch(prop.valid);
        }
        for (key in model.model.validations) {
            dfn = model.model.validations[key];
            for (i = 0; i < dfn.props.length; i++) {
                prop = model[dfn.props[i]];
                for (j = 0; j < dfn.props.length; j++) {
                    if (i === j) {
                        continue;
                    }
                    prop.valid.unwatch(model[dfn.props[j]]);
                }
            }
        }
    });
}

aug(validation, {
    EXEMPT: 'exempt',
    createValidator: function(dfn, prop) {
        var validations = [];

        validations.push(function(v) {
            if (v === null || v === undefined) {
                return dfn.required ? false : validation.EXEMPT;
            }
            return true;
        });

        if (dfn.values) {
            validations.push(function(v) {
                for (var i = 0; i < dfn.values.length; i++) {
                    if (equals(v, dfn.values[i])) {
                        return validation.EXEMPT;
                    }
                }
                return null; // tentative failure
            });
        }

        if (dfn.type) {
            validations.push(function(v) {
                if (isArray(dfn.type)) {
                    for (var i = 0; i < dfn.type.length; i++) {
                        if (validation.hasType(dfn.type[i], v)) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return validation.hasType(dfn.type, v);
                }
            });
        }

        if (dfn.lengthRange) {
            validations.push(function(v) {
                if (typeof v.length !== 'number') {
                    return false;
                }
                if (dfn.lengthRange.min !== undefined) {
                    if (v.length < dfn.lengthRange.min) {
                        return false;
                    }
                }
                if (dfn.lengthRange.max !== undefined) {
                    if (v.length > dfn.lengthRange.max) {
                        return false;
                    }
                }
                return true;
            });
        }

        if (dfn.valueRange) {
            validations.push(function(v) {
                var minValue = 0;
                if (typeof v !== 'number') {
                    return false;
                }
                if (dfn.valueRange.min !== undefined) {
                    minValue = dfn.valueRange.min;
                    if (dfn.valueRange.minExclusive) {
                        minValue += 1;
                        if (v <= dfn.valueRange.min) {
                            return false;
                        }
                    } else if (v < dfn.valueRange.min) {
                        return false;
                    }
                }
                if (dfn.valueRange.max !== undefined) {
                    if (dfn.valueRange.maxExclusive) {
                        if (v >= dfn.valueRange.max) {
                            return false;
                        }
                    } else if (v > dfn.valueRange.max) {
                        return false;
                    }
                }
                if (dfn.valueRange.step !== undefined) {
                    return (v - minValue) % dfn.valueRange.step === 0;
                }
                if (dfn.valueRange.multipleOf !== undefined) {
                    return v % dfn.valueRange.multipleOf === 0;
                }
                return true;
            });
        }

        if (dfn.pattern) {
            var pattern = (
                typeof dfn.pattern === 'string' ?
                new XRegExp(dfn.pattern) :
                dfn.pattern
            );
            validations.push(function(v) {
                return pattern.test(v);
            });
        }

        if (dfn.validate) {
            validations.push(dfn.validate);
        }

        return aug(function() {
            var value = prop(),
                result = true;

            for (var i = 0; i < validations.length; i++) {
                result = validations[i].call(this, value);
                if (result === validation.EXEMPT || result === false) {
                    return result === validation.EXEMPT;
                }
            }
            return result === true;
        }, {validations: validations});
    },
    createModelValidation: function(dfn, model) {
        return function() {
            var values = [];
            for (var i = 0; i < dfn.props.length; i++) {
                values.push(model[dfn.props[i]]());
            }
            return dfn.validate.apply(model, values);
        };
    },
    contributeToModel: function(Model) {
        aug(Model, {
            validations: [],
            validation: function(validate, attrs) {
                this.validations.push({validate: validate, props: attrs});
                return this;
            }
        });
    },
    hasType: function(type, v) {
        if (type === 'integer') {
            return typeof v === 'number' && v === Math.floor(v);
        } else if (typeof type === 'string') {
            return typeof v === type;
        } else {
            return v instanceof type;
        }
    }
});

module.exports = validation;return module.exports;});
