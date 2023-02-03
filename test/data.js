const data = require('../data');
const assert = require('assert');

describe ('data', function() {
    it ('identifies a date string', function() {
        assert.ok(data.isDateString('1/10/2019'));
        assert.ok(data.isDateString('2019-01-10'));
        assert.ok(data.isDateString('2019-01-10T00:00:00.000Z'));
        assert.notEqual(data.isDateString(new Date('1/10/2019')), true);
        assert.notEqual(data.isDateString('7115'), true);
        assert.notEqual(data.isDateString(''), true);
        assert.notEqual(data.isDateString(null), true);
        assert.notEqual(data.isDateString(undefined), true);
        assert.notEqual(data.isDateString(), true);
    });

    it('auto parses dates', function() {
        const object = { id: 1, date: '1/10/2019', amount: -99, description: 'test' };
        const array = [object];
        const results = array.map(data.mapOnLoadStandard());
        assert.ok(results[0].date instanceof Date, "Not a Date instance.");
        assert.equal(results[0].date.getTime(), new Date('1/10/2019').getTime(), "Date is not correct.");
    });
});