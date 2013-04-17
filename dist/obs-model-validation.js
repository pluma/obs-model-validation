/*! obs-model-validation 0.1.0 Copyright (c) 2013 Alan Plum. MIT licensed. */
var aug = require('aug'),
    obs = require('obs');

function validation() {
    var dfn, prop;

    this.valid = obs.computed(function(that) {
        return function() {
            for (var key in that.model.attrs) {
                if (that[key].valid && !that[key].valid()) {
                    return false;
                }
            }
            return true;
        };
    }(this));

    for (var key in this.model.attrs) {
        dfn = this.model.attrs[key];

        if (!dfn || !dfn.validate) {
            continue;
        }

        prop = this[key];
        prop.valid = (
            dfn.validate.lazy ? obs.computed.lazy : obs.computed
        )(validation.createValidator(
            dfn.validate.fn ? dfn.validate.fn : dfn.validate, prop
        ));

        prop.valid.watch(prop);
        this.valid.watch(prop.valid);
        this._destructors.push(validation.createDestructor(prop, this.valid));
    }
}

aug(validation, {
    createValidator: function(validator, prop) {
        if (typeof validator === 'function') {
            return function() {
                return validator(prop());
            };
        }
        if (validator instanceof RegExp) {
            return function() {
                return validator.test(prop());
            };
        }
        throw new Error('Unknown validation type!');
    },
    createDestructor: function(prop, valid) {
        return function() {
            prop.valid.unwatch(prop);
            valid.unwatch(prop.valid);
        };
    }
});

exports.validation = validation;