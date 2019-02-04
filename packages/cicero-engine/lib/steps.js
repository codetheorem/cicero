/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Path = require('path');

const Chai = require('chai');
const expect = Chai.expect;

const Template = require('@accordproject/cicero-core').Template;
const Clause = require('@accordproject/cicero-core').Clause;
const Engine = require('./engine');
const Util = require('./util');

const { Before, Given, When, Then } = require('cucumber');

/**
 * Sends a request to the AP contract
 *
 * @param {object} engine the Cicero engine
 * @param {object} template the template
 * @param {object} clause the clause instance
 * @param {string} currentTime the definition of 'now'
 * @param {object} stateJson state data in JSON
 * @param {object} requestJson state data in JSON
 * @returns {object} Promise to the response
 */
async function send(engine,template,clause,currentTime,stateJson,requestJson) {
    return engine.execute(clause,requestJson,stateJson,currentTime);
}

/**
 * Compare actual result and expected result
 *
 * @param {string} expected the result as specified in the test workload
 * @param {string} actual the result as returned by the engine
 */
function compare(expected,actual) {
    for (const key in expected) {
        if (expected.hasOwnProperty(key)) {
            const field = key;
            const expectedValue = expected[key];
            expect(actual).to.have.property(field);
            const actualValue = actual[field];
            expect(actualValue).to.deep.equal(expectedValue);
        }
    }
}

/**
 * Load a clause from directory
 *
 * @param {string} templateDir the directory for the template
 * @param {object} Promise to the new clause
 */
async function loadClause(templateDir) {
    const template = await Template.fromDirectory(templateDir);
    return new Clause(template);
}

// Defaults
const defaultState = {'stateId':'1','$class':'org.accordproject.cicero.contract.AccordContractState'};

Before(function () {
    this.engine = new Engine();
    this.currentTime = '1970-01-01T00:00:00Z';
    this.state = defaultState;
    this.clause = null;
    this.request = null;
});

Given('the template in {string}', async function(dir) {
    const templateDir = Path.resolve(Util.resolveRootDir(this.parameters),dir);
    const clause = await loadClause(templateDir);
    this.request = clause.getTemplate().getMetadata().getRequest();
    this.clause = clause;
});

Given('the current time is {string}', function(currentTime) {
    this.currentTime = currentTime;
});

Given('that the contract says', async function (contractText) {
    if (this.clause) {
        this.clause.parse(contractText);
    } else {
        const clause = await loadClause('.');
        this.request = clause.getTemplate().getMetadata().getRequest();
        this.clause = clause;
    }
});

When('it receives the request', function (actualRequest) {
    this.request = JSON.parse(actualRequest);
});

Then('it should respond with', function (expectedResponse) {
    const response = JSON.parse(expectedResponse);
    return send(this.engine,this.template,this.clause,this.currentTime,this.state,this.request)
        .then((actualAnswer) => {
            this.answer = actualAnswer;
            expect(actualAnswer).to.have.property('response');
            expect(actualAnswer).to.not.have.property('error');
            return compare(response,actualAnswer.response);
        });
});

