# Synopsis

Model validation plugin for [observable models](https://github.com/pluma/obs-model).

# Basic usage example

```javascript
var User = model('User')
    .use(validation),
    .attr('id', {pattern: /^[1-9][0-9]+$/})
    .attr('username', {
        validate: function(v) {
            return v && v.toLowerCase && v === v.toLowerCase();
        }
    });

var admin = new User({id: 1, username: 'admin'});
console.log(admin.valid()); // true
console.log(admin.id(), admin.id.valid()); // 1, true
console.log(admin.username(), admin.username.valid()); // "admin", true

admin.valid.subscribe(function(valid) {
    console.log('Admin user is now ' + (valid ? 'valid' : 'invalid'));
});

admin.id(0);
// -> "Admin user is now invalid"
console.log(admin.id(), admin.id.valid()); // 0, false
console.log(admin.valid()); // false

admin.id(1);
// -> "Admin user is now valid"
console.log(admin.id(), admin.id.valid()); // 1, true
console.log(admin.valid()); // true

admin.username('ADMIN');
// -> "Admin user is now invalid"
console.log(admin.username(), admin.username.valid()); // "ADMIN", false
console.log(admin.valid()); // false
```

# API

## validation

The validation plugin. Use with `Model.use(validation)`.

## Model.attr(name:String, options:Object)

The `options` argument is expanded to allow defining validation requirements for each field.

### options.required:Boolean (Default: false)

Defines whether the attribute is required. If `required` is set to `true`, the attribute will fail validation if its value is `null` or `undefined`. If `required` is set to `false`, the attribute will be exempt from further validation and marked valid if its value is `null` or `undefined`.

### options.values:Array

Defines an array of possible values that will exempt the attribute from further validation (resulting in it being marked as valid without having to pass any further validations defined on the attribute).

**NOTE**: Uses [jkroso's equals 0.2.0](https://github.com/jkroso/equals/tree/0.2.0) for value comparison.

### options.type

Defines a type or an array of types the attribute value is expected to match. A type can be defined either as the string return value of a `typeof` check, a constructor function the value is expected to be an `instanceof` or the special string value `integer` which will match any whole `number` (including `Infinity`).

If the attribute value does not match any of the expected types, the attribute will fail validation.

### options.lengthRange:Integer

Defines a range the length of the attribute value is expected to match. If the value has no `length` property or the value of its `length` property is not a `number`, it will always fail this validation.

#### options.lengthRange.min:Integer

Defines the expected minimum length of the attribute value. If the length of the attribute value is less than `min`, it will fail validation.

#### options.lengthRange.max:Integer

Defines the expected maximum length of the attribute value. If the length of the attribute value is greater than `max`, it will fail validation.

### options.valueRange

Defines a range the attribute value is expected to match. If the value is not a `number`, it will always fail this validation.

#### options.valueRange.min:Number and options.valueRange.minExclusive:Boolean

Defines the expected minimum attribute value. If the attribute value is less than `min`, it will fail validation. If `minExclusive` is set to `true`, the attribute value will also fail if it is equal to `min`.

#### options.valueRange.max:Number and options.valueRange.maxExclusive:Boolean

Defines the expected maximum attribute value. If the attribute value is greater than `max`, it will fail validation. If `maxExclusive` is set to `true`, the attribute value will also fail if it is equal to `max`.

#### options.valueRange.step:Number

Defines a number the attribute value is expected to be a multiple of, offset by the smallest possible integer matching the `min` and `minExclusive` requirements, or `0` if `min` is not set.

For example: if `step` is set to `2` and `min` is set to `1` (`minExclusive` is not set or is set to `false`), the attribute value is expected to match `x * 2 + 1`, i.e. `1, 3, 5, 7, …`.

#### options.valueRange.multipleOf:Number

Defines a number the attribute value is expected to be a multiple of (offset by `0`, rather than `min`).

### options.pattern:RegExp

A regular expression the attribute value is expected to be tested successfully against. If `pattern` is a string, it will be converted into a regular expression when the model instance is created. If [XRegExp](https://github.com/slevithan/xregexp) is available, string values will be converted using that library instead.

**NOTE**: Although `pattern` SHOULD be set to a regular expression or a full string representation of a regular expression, any object that has a `test` method should behave as expected.

### options.validate:Function

Defines a custom validation function the attribute value will be passed to. The function will be bound to the model instance and should return `false` if the value has failed validation or `true` if the validation was successful.

Alternatively, the function can return `null`, indicating the validation has failed tentatively, or the special value `validation.EXEMPT` (equivalent to the string value `exempt`) if the attribute should be exempted from further validation and marked valid. See below for further details.

## Model.validation(validate:Function, attrs:Array)

Defines a multi-attribute validation function and an array of attribute names it affects. The validation function will be passed the current value of each attribute in the order specified whenever the value of one of the attributes changes and is bound to the model instance.

The referenced attributes have to exist on the model instance at the time of its creation.

Multi-attribute validations executed in the order they are added to the model, but will only be executed after all regular attribute validations have passed and the attribute value is not exempt from further validation.

The validation function should return `true`, `false`, `null` or `validation.EXEMPT` (see below).

## Model#[attrName].valid

Every attribute receives an observable property `valid` which indicates whether the attribute value passed validation.

## Model#valid

Each model instance receives an observable property `valid` which indicates whether all attributes passed validation.

# Validation function return values

Attribute validation functions and mult-attribute validation functions MUST return one of the following values. If multiple validation functions exist for the same attribute (e.g. because the attribute is affected by other multi-attribute validations), they will be executed in the order they were defined on the model, with regular attribute validation functions being executed before multi-attribute validations affecting the same attribute.

## `true`

The validation was tentatively successful. Any pending validations on the same attribute will be executed normally. If this was the last validation to be executed on this attribute, the attribute will be marked as *valid*.

## `false`

The validation has failed. Any pending validations on the same attribute will be ignored and the attribue will be marked as *invalid*.

## `null`

The validation has tentatively failed. Any pending validations on the same attribute will be executed normally. If this was the last validation to be executed on this attribute, the attribute will be marked as *invalid*.

## `validation.EXEMPT`

The validation was successful. Any pending validations on the same attribute will be ignored and the attribute will be marked as *valid*.

**NOTE**: The string value `exempt` can be used instead. This value is available as a property on the `validation` plugin to avoid sneaky typos.

# License

The MIT/Expat license