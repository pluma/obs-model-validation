# Synopsis

Model validation plugin for [observable models](https://github.com/pluma/obs-model).

# Basic usage example

```javascript
var User = model('User')
    .use(validation),
    .attr('id', {validate: /^[1-9][0-9]+$/})
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

## Model.attr(name, options)

The `options` argument is expanded to allow an optional property `validate`.

The value can be either a regular expression or a function which will receive the attribute value whenever it changes.

The value can also be an object with the keys `fn` and `lazy`, with `fn` containing either a regular expression or a function and `lazy` being an optional boolean. If `lazy` is set to `True`, the validation will not be applied automatically whenever the value changes but only when it is accessed directly.

**NOTE**: If a model uses any lazy validations, the model's `dirty` property will only reflect changes to lazy `dirty` fields when they are accessed directly.

## Model#[attrName].dirty

Each validated attribute receives an observable property `dirty` which indicates whether the property passed validation.

## Model#dirty

Each model instance receives an observable property `dirty` which indicates whether all validated properties passed validation.
