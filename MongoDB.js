Ext.define('Ban.data.proxy.MongoDB', {
    alias: 'proxy.mongodb',
    extend: 'Ext.data.proxy.Client',
    alternateClassName: 'Ext.data.proxy.MongoDB',

    isSQLProxy: false,

    config: {
        /**
         * @cfg {Object} reader
         * @hide
         */
        reader: null,
        /**
         * @cfg {Object} writer
         * @hide
         */
        writer: null,
        /**
         * @cfg {String} table
         * Optional Table name to use if not provided ModelName will be used
         */
        table: null,
        /**
         * @cfg {String} database
         * Database name to access tables from
         */
        database: 'Sencha',

        uniqueIdStrategy: false,

        defaultDateFormat: 'Y-m-d H:i:s.u',

        dbCollection: false

    },

    updateModel: function (model) {
        if (model) {
            var modelName = model.modelName,
                defaultDateFormat = this.getDefaultDateFormat();

            model.getFields().each(function (field) {
                if (field.getType().type === 'date' && !field.getDateFormat()) {
                    field.setDateFormat(defaultDateFormat);
                }
            });

            this.setUniqueIdStrategy(model.getIdentifier().isUnique);

        }

        this.callParent(arguments);
    },

    setException: function (operation, error) {
        operation.setException(error);
    },

    create: function (operation, callback, scope) {

        var me = this,
            records = operation.getRecords(),
            totalRecords = records.length,
            executed = 0,
            collection = me.getCollection(),
            insertedRecords = [],
            result,
            errors = [];

        operation.setStarted();

        result = new Ext.data.ResultSet({
            records: insertedRecords,
            success: true
        });

        Ext.each(records, function (record) {
            var data = me.getRecordData(record),
                promise = collection.insert(data);

            promise.on('complete', function (err, doc) {

                if (Ext.isDefined(err) && !Ext.isEmpty(err)) {
                    console.log(('mongo error: ' + err).error);
                    errors.push({
                        clientId: record.getId(),
                        error: err
                    });
                } else {
                    delete doc._id;
                    insertedRecords.push({
                        clientId: record.getId(),
                        id: data.id,
                        data: data,
                        node: data
                    });
                }

                executed += 1;
                if (executed >= totalRecords) {
                    if (operation.process(operation.getAction(), result) === false) {
                        me.fireEvent('exception', me, operation);
                    }

                    if (errors.length) {
                        operation.setException(errors);
                    }

                    if (typeof callback == 'function') {
                        callback.call(scope || me, operation);
                    }
                }
            });

        });

    },

    read: function (operation, callback, scope) {

        var me = this,
            model = me.getModel(),
            idProperty = model.getIdProperty(),
            params = operation.getParams() || {},
            id = params[idProperty],
            sorters = operation.getSorters(),
            filters = operation.getFilters(),
            page = operation.getPage(),
            start = operation.getStart(),
            limit = operation.getLimit(),
            filtered,
            readRecords = [],
            result,
            collection = me.getCollection(),
            filterObj = {}, filter, i, ln, promise, data;

        this.ensureIndices();

        operation.setStarted();

        result = new Ext.data.ResultSet({
            records: readRecords,
            success: true
        });

        if (id === undefined) {
            for (i = 0; i < filters.length; i+= 1) {
                filter = filters[i];
                filterObj[filter.getProperty()] = filter.getValue();
            }
        } else {
            filterObj[idProperty] = id;
        }

        promise = collection.find(filterObj);
        promise.on('complete', function (err, docs) {

            if (err) {
                console.log(('mongo error: ' + err).error);
                operation.setException(err);
                result.setSuccess(false);
            } else {

                for (i = 0; i < docs.length; i+= 1) {
                    data = docs[i];
                    delete data._id;

                    readRecords.push({
                        clientId: null,
                        id: data.id,
                        data: data,
                        node: data
                    });
                }

                if (operation.process(operation.getAction(), result) === false) {
                    me.fireEvent('exception', me, operation);
                }

                result.setSuccess(true);
                result.setTotal(readRecords.length);
                result.setCount(readRecords.length);

                if (filters && filters.length) {
                    filtered = Ext.create('Ext.util.Collection', function(record) {
                        return record.getId();
                    });
                    filtered.setFilterRoot('data');
                    for (i = 0, ln = filters.length; i < ln; i++) {
                        if (filters[i].getProperty() === null) {
                            filtered.addFilter(filters[i]);
                        }
                    }
                    filtered.addAll(operation.getRecords());

                    operation.setRecords(filtered.items.slice());
                    result.setRecords(operation.getRecords());
                    result.setCount(filtered.items.length);
                    result.setTotal(filtered.items.length);
                }

            }

            if (typeof callback == 'function') {
                callback.call(scope || me, operation);
            }

        });

    },

    update: function (operation, callback, scope) {

        var me = this,
            records = operation.getRecords(),
            totalRecords = records.length,
            executed = 0,
            collection = me.getCollection(),
            updatedRecords = [],
            result,
            errors = [];

        operation.setStarted();

        result = new Ext.data.ResultSet({
            records: updatedRecords,
            success: true
        });

        Ext.each(records, function (record) {
            var data = me.getRecordData(record),
                promise = collection.update({ id: record.get('id') }, data);

            promise.on('complete', function (err, doc) {

                if (Ext.isDefined(err) && !Ext.isEmpty(err)) {
                    console.log(('mongo error: ' + err).error);
                    errors.push({
                        clientId: record.getId(),
                        error: err
                    });
                } else {
                    delete doc._id;
                    updatedRecords.push({
                        clientId: record.getId(),
                        id: data.id,
                        data: data,
                        node: data
                    });
                }

                executed += 1;
                if (executed >= totalRecords) {
                    if (operation.process(operation.getAction(), result) === false) {
                        me.fireEvent('exception', me, operation);
                    }

                    if (errors.length) {
                        operation.setException(errors);
                    }

                    if (typeof callback == 'function') {
                        callback.call(scope || me, operation);
                    }
                }
            });

        });

    },

    destroy: function (operation, callback, scope) {

        var me = this,
            records = operation.getRecords(),
            totalRecords = records.length,
            executed = 0,
            collection = me.getCollection(),
            destroyedRecords = [],
            result,
            errors = [];

        operation.setStarted();

        result = new Ext.data.ResultSet({
            records: destroyedRecords,
            success: true
        });

        Ext.each(records, function (record) {
            var data = me.getRecordData(record),
                promise = collection.remove({
                    id: record.get('id')
                });

            promise.on('complete', function (err, doc) {

                if (Ext.isDefined(err) && !Ext.isEmpty(err)) {
                    console.log(('mongo error: ' + err).error);
                    errors.push({
                        clientId: record.getId(),
                        error: err
                    });
                } else {
                    destroyedRecords.push({
                        id: record.get('id')
                    });
                }

                executed += 1;

                if (executed >= totalRecords) {

                    if (operation.process(operation.getAction(), result) === false) {
                        me.fireEvent('exception', me, operation);
                    }

                    if (errors.length) {
                        operation.setException(errors);
                    }

                    if (typeof callback == 'function') {
                        callback.call(scope || me, operation);
                    }
                }
            });

        });

    },

    getRecordData: function (record) {
        var me = this,
            fields = record.getFields(),
            idProperty = record.getIdProperty(),
            uniqueIdStrategy = me.getUniqueIdStrategy(),
            data = {},
            name;

        fields.each(function (field) {

            if (field.getPersist()) {
                name = field.getName();
                if (name === idProperty && !uniqueIdStrategy) {
                    return;
                }

                data[name] = record.get(name);
            }
        }, this);

        return data;
    },

    ensureIndices: function () {

        var collection = this.getCollection(),
            fields = this.getModel().getFields(),
            idProperty = this.getModel().getIdProperty();

        fields.each(function (field) {

            if (field.config.index || field.getName() === idProperty) {
                collection.ensureIndex(field.getName());
            }

        }, this);

    },

    getCollection: function () {

        var me = this;
        if (!me.getDbCollection()) {
            var monk = require('monk'),
                db = monk('localhost:27017/' + me.getDatabase());
            me.setDbCollection(db.get(me.getModel().modelName.split('.').reverse()[0]));
        }

        return me.getDbCollection();

    }
})
;
