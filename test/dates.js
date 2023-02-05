const dates = require('../dates.js');
const assert = require('assert');


describe ('dates', function() {
    /*
    it('parses ISO date without time as local', function() {
        assert.ok(dates.parseDateAsLocal('2022-12-30').getTime() == new Date(2022, 11, 30).getTime());
    });
    */

    it ('identifies a date string', function() {
        assert.ok(dates.isDateString('1/10/2019'));
        assert.ok(dates.isDateString('2019-01-10'));
        assert.ok(dates.isDateString('2019-01-10T00:00:00.000Z'));
    });

    it ('does not identify a Date instance as a date string', function() {
        assert.notEqual(dates.isDateString(new Date('1/10/2019')), true);
    });

    it ('does not identify numbers that Date can parse as a year as being a date string', function() {
        assert.notEqual(dates.isDateString('2019'), true);
        assert.notEqual(dates.isDateString(2019), true);
    });

    it ('does not identify strings that are not in a date format as being a date string', function() {
        assert.notEqual(dates.isDateString('01012019'), true);
    });

    it ('does not identify null/empty/undefined as being a date string', function() {
        assert.notEqual(dates.isDateString(''), true);
        assert.notEqual(dates.isDateString(null), true);
        assert.notEqual(dates.isDateString(undefined), true);
        assert.notEqual(dates.isDateString(), true);
    });

    it ('does not identify date-formatted strings as dates when month/day is invalid', function() {
        assert.notEqual(dates.isDateString('13/10/2019'), true);
        assert.notEqual(dates.isDateString('1/32/2019'), true);
    });

    it('parses ISO date/time with UTC time zone as same date/time in local time zone', function() {
        const month = 12;
        const day = 30;
        const year = 2022;
        const parsedDate = dates.parseDateAsLocal(`${year}-${month}-${day}T00:00:00.000Z`);
        const localDate = new Date(2022, month - 1, day);
        assert.ok(parsedDate.getTime() == localDate.getTime());
    });


    it('parses ISO date-only string (without time or time zone) as same date in local time zone', function() {
        const ISO_DATE_STRING = '2022-12-30';
        const date = dates.parseDateAsLocal(ISO_DATE_STRING);
        assert.equal(date.getFullYear(), 2022);
        assert.equal(date.getMonth(), 11);
        assert.equal(date.getDate(), 30);
        assert.equal(date.getHours(), 0);
        assert.equal(date.getMinutes(), 0);
    });

    it ('convert date to ISO string without time', function() {
        const ISO_DATE_STRING = '2022-12-30';
        const date = dates.parseDateAsLocal(ISO_DATE_STRING);
        const isoString = date.toISOStringWithoutTime();
        assert.equal(isoString, ISO_DATE_STRING);
    });
    
});