const assert = require('assert');
const json = require('../json');
const fs = require('fs');

describe ('json', function() {
    it('formats dates right when rendering JSON', function() {
        const date = new Date('2021-12-01');
        var actual = json.render({date: date});
        const expected = `{ "date": "${date.toLocaleDateString()}" }`;
        assert.equal(actual, expected, "JSON format not as expected.");
    });

    it('omits rendering properties whose value is null or undefined', function() {
        const object = { };
        object.id = "1a3c42b";
        object.date = null;
        object.description = "Test";
        var actual = json.render(object);
        const expected = '{ "id": "1a3c42b", "description": "Test" }';
        assert.equal(actual, expected, "JSON format not as expected.");
    });

    it('formats JSON as before', function() {
        const order0 = {id: "1001", date: new Date('2021-12-01')};
        const order1 = {id: "1002", date: new Date('2021-12-01')};
        const order2 = JSON.parse(JSON.stringify(order1));
        order2.id = "1003";
        order2.customer = {name: "John Doe", address: "123 Main St"};
        order2.payment = { type: "credit", card: { onfile: true } };
        order2.items = [{sku: "1AXU45", price: 9.99, count: 1}, {sku: "1AXU46", price: 5.99, count: 2}];
        const array = [order0, order1, order2];
        var actual = json.render(array);
        assert.doesNotThrow(() => JSON.parse(actual), "JSON parse error.");
        //fs.writeFileSync("./test/expected-2.json", actual);
        const expected = fs.readFileSync("./test/expected.json", "utf-8");
        assert.equal(actual, expected, "JSON does not match previous.");
    });
});