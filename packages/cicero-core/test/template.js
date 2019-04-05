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

const Template = require('../lib/template');
const fs = require('fs');
const archiver = require('archiver');

const chai = require('chai');
const assert = require('chai').assert;

chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

/* eslint-disable */
function waitForEvent(emitter, eventType) {
    return new Promise((resolve) => {
        emitter.once(eventType, resolve);
    });
}

async function writeZip(template){
    try {
        fs.mkdirSync('./test/data/archives');
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
    let output = fs.createWriteStream(`./test/data/archives/${template}.zip`);
    let archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);
    archive.directory(`test/data/${template}/`, false);
    archive.finalize();

    return await waitForEvent(output, 'close');
}
/* eslint-enable */

describe('Template', () => {

    describe('#fromDirectory', () => {

        it('should create a template from a directory with no @AccordClauseLogic in logic', () => {
            return Template.fromDirectory('./test/data/no-logic').should.be.fulfilled;
        });

        it('should create a template from a directory with no logic', async () => {
            const template = await Template.fromDirectory('./test/data/text-only');
            template.hasLogic().should.equal(false);
        });

        it('should create a template from a directory', () => {
            return Template.fromDirectory('./test/data/latedeliveryandpenalty').should.be.fulfilled;
        });

        it('should throw error when Ergo logic does not parse', async () => {
            return Template.fromDirectory('./test/data/bad-logic').should.be.rejectedWith('Parse error (at file lib/logic.ergo line 14 col 4). \n    define agreed = request.agreedDelivery;\n    ^^^^^^                                 ');
        });

        it('should throw an error if archive language is not a valid target', async () => {
            const templatePromise = Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return templatePromise.then((template) => template.toArchive('foo')).should.be.rejectedWith('Unknown target: foo (available: es5,es6,cicero,java)');
        });

        it('should throw an error if archive language is is absent', async () => {
            const templatePromise = Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return templatePromise.then((template) => template.toArchive()).should.be.rejectedWith('language is required and must be a string');
        });

        it('should roundtrip a source template (Ergo)', async function() {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.hasLogic().should.equal(true);
            template.getIdentifier().should.equal('latedeliveryandpenalty@0.0.1');
            template.getModelManager().getModelFile('io.clause.latedeliveryandpenalty').should.not.be.null;
            template.getParserManager().getGrammar().should.not.be.null;
            template.getScriptManager().getScripts().length.should.equal(1);
            template.getScriptManager().getLogic().length.should.equal(1);
            template.getMetadata().getREADME().should.not.be.null;
            template.getMetadata().getRequest().should.not.be.null;
            template.getMetadata().getKeywords().should.not.be.null;
            template.getName().should.equal('latedeliveryandpenalty');
            template.getDescription().should.equal('Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 9 DAY of delay penalty amounting to 7% of the total value of the Equipment whose delivery has been delayed. Any fractional part of a DAY is to be considered a full DAY. The total amount of penalty shall not however, exceed 2% of the total value of the Equipment involved in late delivery. If the delay is more than 2 WEEK, the Buyer is entitled to terminate this Contract.');
            template.getVersion().should.equal('0.0.1');
            template.getMetadata().getSample().should.equal('Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 9 days of delay penalty amounting to 7% of the total value of the Equipment whose delivery has been delayed. Any fractional part of a days is to be considered a full days. The total amount of penalty shall not however, exceed 2% of the total value of the Equipment involved in late delivery. If the delay is more than 2 weeks, the Buyer is entitled to terminate this Contract.');
            template.getHash().should.equal('d6d3e3816f4d0deaa659f9b1c7efcb00005da19e6d615c2b7ccf3997a6eab855');
            const buffer = await template.toArchive('ergo');
            buffer.should.not.be.null;
            const template2 = await Template.fromArchive(buffer);
            template2.getIdentifier().should.equal(template.getIdentifier());
            template2.getModelManager().getModelFile('io.clause.latedeliveryandpenalty').should.not.be.null;
            template2.getParserManager().getGrammar().should.not.be.null;
            template2.getParserManager().getTemplatizedGrammar().should.equal(template.getParserManager().getTemplatizedGrammar());
            template2.getScriptManager().getScripts().length.should.equal(template.getScriptManager().getScripts().length);
            template2.getMetadata().getREADME().should.equal(template.getMetadata().getREADME());
            template2.getMetadata().getKeywords().should.eql(template.getMetadata().getKeywords());
            template2.getMetadata().getSamples().should.eql(template.getMetadata().getSamples());
            template2.getHash().should.equal(template.getHash());
            const buffer2 = await template2.toArchive('ergo');
            buffer2.should.not.be.null;
        });

        it('should roundtrip a compiled template (JavaScript)', async function() {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty_js');
            template.getIdentifier().should.equal('latedeliveryandpenalty@0.0.1');
            template.getModelManager().getModelFile('io.clause.latedeliveryandpenalty').should.not.be.null;
            template.getParserManager().getGrammar().should.not.be.null;
            template.getScriptManager().getScripts().length.should.equal(1);
            template.getMetadata().getREADME().should.not.be.null;
            template.getMetadata().getRequest().should.not.be.null;
            template.getMetadata().getKeywords().should.not.be.null;
            template.getName().should.equal('latedeliveryandpenalty');
            template.getDescription().should.equal('Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 9 DAY of delay penalty amounting to 7% of the total value of the Equipment whose delivery has been delayed. Any fractional part of a DAY is to be considered a full DAY. The total amount of penalty shall not however, exceed 2% of the total value of the Equipment involved in late delivery. If the delay is more than 2 WEEK, the Buyer is entitled to terminate this Contract.');
            template.getVersion().should.equal('0.0.1');
            template.getMetadata().getSample().should.equal('Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 9 days of delay penalty amounting to 7% of the total value of the Equipment whose delivery has been delayed. Any fractional part of a days is to be considered a full days. The total amount of penalty shall not however, exceed 2% of the total value of the Equipment involved in late delivery. If the delay is more than 2 weeks, the Buyer is entitled to terminate this Contract.');
            template.getHash().should.equal('075a57a1b043ee1345c1b48aa2be76ed9196311b7236249ac07acc00df83191f');
            const buffer = await template.toArchive('cicero');
            buffer.should.not.be.null;
            const template2 = await Template.fromArchive(buffer);
            template2.getIdentifier().should.equal(template.getIdentifier());
            template2.getModelManager().getModelFile('io.clause.latedeliveryandpenalty').should.not.be.null;
            template2.getParserManager().getGrammar().should.not.be.null;
            template2.getParserManager().getTemplatizedGrammar().should.equal(template.getParserManager().getTemplatizedGrammar());
            template2.getScriptManager().getScripts().length.should.equal(template.getScriptManager().getScripts().length);
            template2.getMetadata().getREADME().should.equal(template.getMetadata().getREADME());
            template2.getMetadata().getKeywords().should.eql(template.getMetadata().getKeywords());
            template2.getMetadata().getSamples().should.eql(template.getMetadata().getSamples());
            template2.getHash().should.equal(template.getHash());
            const buffer2 = await template2.toArchive('cicero');
            buffer2.should.not.be.null;
        });

        it('should throw an error if multiple template models are found', async () => {
            return Template.fromDirectory('./test/data/multiple-concepts').should.be.rejectedWith('Found multiple instances of org.accordproject.cicero.contract.AccordClause in conga. The model for the template must contain a single asset that extends org.accordproject.cicero.contract.AccordClause.');
        });

        it('should throw an error if no template models are found', async () => {
            return Template.fromDirectory('./test/data/no-concepts').should.be.rejectedWith('Failed to find an asset that extends org.accordproject.cicero.contract.AccordClause in conga. The model for the template must contain a single asset that extends org.accordproject.cicero.contract.AccordClause.');
        });

        it('should throw an error if a package.json file does not exist', async () => {
            try {
                await Template.fromDirectory('./test/data/no-packagejson');
                assert.isOk(false,'should throw an error if a package.json file does not exist');
            }
            catch(err) {
                // ignore
            }
        });

        it('should create a template from a directory with a locale sample', () => {
            return Template.fromDirectory('./test/data/locales-conga').should.be.fulfilled;
        });

        it('should throw an error if a sample.txt file does not exist', async () => {
            try {
                await Template.fromDirectory('./test/data/no-sample');
                assert.isOk(false,'should throw an error if a sample.txt file does not exist');
            }
            catch(err) {
                // ignore
            }
        });

        it('should throw an error if the locale is not in the IETF format', async () => {
            try {
                await Template.fromDirectory('./test/data/bad-locale');
                assert.isOk(false,'should throw an error if the locale is not in the IETF format');
            }
            catch(err) {
                // ignore
            }
        });

        // Test case for issue #23
        it('should create template from a directory that has node_modules with duplicate namespace', () => {
            return Template.fromDirectory('./test/data/with-node_modules').should.be.fulfilled;
        });

        it('should throw an error for property that is not declared', () => {
            return Template.fromDirectory('./test/data/bad-property').should.be.rejectedWith('Template references a property \'currency\' that is not declared in the template model');
        });

        it('should throw an error for clause property that is not declared', () => {
            return Template.fromDirectory('./test/data/bad-copyright-license').should.be.rejectedWith('Template references a property \'badPaymentClause\' that is not declared in the template model');
        });

        it('should create an archive for a template with two Ergo modules', async () => {
            return Template.fromDirectory('./test/data/hellomodule').should.be.fulfilled;
        });

        it('should fail creating an archive for a template for a wrong Ergo module call', async () => {
            return Template.fromDirectory('./test/data/hellomodule-bug').should.be.rejectedWith('Type error (at file lib/logic.ergo line 23 col 11). This operator received unexpected arguments');
        });
    });

    describe('#fromArchive', () => {

        it('should create a template from an archive', async () => {
            const buffer = fs.readFileSync('./test/data/latedeliveryandpenalty.cta');
            return Template.fromArchive(buffer).should.be.fulfilled;
        });

        it('should throw an error if multiple template models are found', async () => {
            await writeZip('multiple-concepts');
            const buffer = fs.readFileSync('./test/data/archives/multiple-concepts.zip');
            return Template.fromArchive(buffer).should.be.rejectedWith('Found multiple instances of org.accordproject.cicero.contract.AccordClause in conga. The model for the template must contain a single asset that extends org.accordproject.cicero.contract.AccordClause.');
        });

        it('should throw an error if a package.json file does not exist', async () => {
            await writeZip('no-packagejson');
            const buffer = fs.readFileSync('./test/data/archives/no-packagejson.zip');
            return Template.fromArchive(buffer).should.be.rejectedWith('Failed to find package.json');
        });
    });

    describe('#fromUrl', () => {

        it('should throw an error if an archive loader cannot be found', async () => {

            try {
                await Template.fromUrl('ab://ip-payment@0.9.0#hash', null);
                assert.isOk(false,'should throw an error if an archive loader cannot be found');
            }
            catch(err) {
                // ignore
            }
        });

        it('should create a template from an archive at a given URL', async () => {
            const url = 'https://templates.accordproject.org/archives/ip-payment@0.10.0.cta';
            return Template.fromUrl(url, null).should.be.fulfilled;
        });

        it('should create a template from an archive at a given AP URL', async () => {
            const url = 'ap://ip-payment@0.10.0#hash';
            return Template.fromUrl(url, null).should.be.fulfilled;
        });

        it('should throw an error if creating a template from a wrongly formed AP URL', async () => {
            try {
                await Template.fromUrl('ap://ip-payment@0.9.0', null);
                assert.isOk(false,'should throw an error if creating a template from a wrongly formed AP URL');
            }
            catch(err) {
                // ignore
            }
        });

        it('should create a template from an archive at a given github URL', async () => {
            const url = 'github://accordproject/cicero-template-library/master/build/archives/ip-payment@0.10.0.cta';
            return Template.fromUrl(url, {'encoding':null,'headers':{'Accept': '*/*','Accept-Encoding': 'deflate, gzip'}}).should.be.fulfilled;
        });

        it('should throw an error if creating a template from a wrong URL', async () => {
            const url = 'https://templates.accordproject.org/archives/doesnotexist@0.3.0.cta';
            return Template.fromUrl(url, null).should.be.rejectedWith('Request to URL [https://templates.accordproject.org/archives/doesnotexist@0.3.0.cta] returned with error code: 404');
        });

        it('should throw an error if creating a template from a github URL to an archive with the wrong Cicero version', async () => {
            const url = 'github://accordproject/cicero-template-library/master/build/archives/acceptance-of-delivery@0.3.0.cta';
            return Template.fromUrl(url, {'encoding':null,'headers':{'Accept': '*/*','Accept-Encoding': 'deflate, gzip'}}).should.be.rejectedWith('The template targets Cicero (^0.4.6) but the Cicero version is');
        });

        it('should throw an error if creating a template from a non existing URL', async () => {
            const url = 'https://emplates.accordproject.org/archives/doesnotexist@0.3.0.cta';
            return Template.fromUrl(url, {'encoding':null,'headers':{'Accept': '*/*','Accept-Encoding': 'deflate, gzip'}}).should.be.rejectedWith('Server did not respond for URL [https://emplates.accordproject.org/archives/doesnotexist@0.3.0.cta]');
        });
    });

    describe('#setSamples', () => {

        it('should not throw for valid samples object', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return (() => template.setSamples({ default: 'sample text' })).should.not.throw();
        });

        it('should throw for null samples object', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return (() => template.setSamples(null)).should.throw('sample.txt is required');
        });
    });

    describe('#setSample', () => {

        it('should not throw for valid sample object', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return (() => template.setSample('sample text','default')).should.not.throw();
        });
    });

    describe('#setRequest', () => {

        it('should set a new request', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const newrequest = {};
            newrequest.$class = 'io.clause.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest';
            newrequest.forceMajeure = true;
            newrequest.agreedDelivery = 'December 17, 2018 03:24:00';
            newrequest.deliveredAt = null;
            newrequest.goodsValue = 300.00;
            template.setRequest(newrequest);
            const updatedRequest = template.getMetadata().getRequest();
            updatedRequest.$class.should.equal('io.clause.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest');
            updatedRequest.forceMajeure.should.equal(true);
            updatedRequest.goodsValue.should.equal(300.00);
        });
    });

    describe('#setReadme', () => {

        it('should not throw for valid readme text', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return (() => template.setReadme('readme text')).should.not.throw();
        });
    });

    describe('#getRequestTypes', () => {

        it('should return request types for single accordclauselogic function', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const types = template.getRequestTypes();
            types.should.be.eql([
                'io.clause.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest',
            ]);
        });

        it('should return empty array when no logic is defined', async () => {
            const template = await Template.fromDirectory('./test/data/no-logic');
            const types = template.getRequestTypes();
            types.should.be.eql([]);
        });
    });

    describe('#getResponseTypes', () => {

        it('should return response type for single accordclauselogic function', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const types = template.getResponseTypes();
            types.should.be.eql([
                'io.clause.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse',
            ]);
        });

        it('should return empty array when no logic is defined', async () => {
            const template = await Template.fromDirectory('./test/data/no-logic');
            const types = template.getRequestTypes();
            types.should.be.eql([]);
        });
    });

    describe('#getEmitTypes', () => {

        it('should return the default emit type for a clause without emit type declaration', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const types = template.getEmitTypes();
            types.should.be.eql([
                'org.accordproject.base.Event',
            ]);
        });

        it('should return emit type when declared in a clause', async () => {
            const template = await Template.fromDirectory('./test/data/helloemit');
            const types = template.getEmitTypes();
            types.should.be.eql([
                'org.accordproject.helloemit.Greeting',
            ]);
        });

        it('should return empty array when no logic is defined', async () => {
            const template = await Template.fromDirectory('./test/data/no-logic');
            const types = template.getEmitTypes();
            types.should.be.eql([]);
        });
    });

    describe('#getStateTypes', () => {

        it('should return the default state type for a clause without state type declaration', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const types = template.getStateTypes();
            types.should.be.eql([
                'org.accordproject.cicero.contract.AccordContractState',
            ]);
        });

        it('should return state type when declared in a clause', async () => {
            const template = await Template.fromDirectory('./test/data/helloemit');
            const types = template.getStateTypes();
            types.should.be.eql([
                'org.accordproject.cicero.contract.AccordContractState',
            ]);
        });

        it('should return empty array when no logic is defined', async () => {
            const template = await Template.fromDirectory('./test/data/no-logic');
            const types = template.getStateTypes();
            types.should.be.eql([]);
        });
    });

    describe('#getHash', () => {
        it('should return a SHA-256 hash', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.getHash().should.equal('d6d3e3816f4d0deaa659f9b1c7efcb00005da19e6d615c2b7ccf3997a6eab855');
        });
    });

    describe('#getTemplateLogic', () => {
        it('should return a Template Logic', async () => {
            const TemplateLogic = require('@accordproject/ergo-compiler').TemplateLogic;
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.getTemplateLogic('cicero').should.be.an.instanceof(TemplateLogic);
        });
    });

    describe('#getFactory', () => {
        it('should return a Factory', async () => {
            const Factory = require('composer-concerto').Factory;
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.getFactory().should.be.an.instanceof(Factory);
        });
    });

    describe('#getSerializer', () => {
        it('should return a Serializer', async () => {
            const Serializer = require('composer-concerto').Serializer;
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.getSerializer().should.be.an.instanceof(Serializer);
        });
    });

    describe('#setPackageJson', () => {
        it('should set the package json of the metadata', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const packageJson = template.getMetadata().getPackageJson();
            packageJson.name = 'new_name';
            template.setPackageJson(packageJson);
            template.getMetadata().getPackageJson().name.should.be.equal('new_name');
        });
    });

    describe('#setKeywords', () => {
        it('should set the keywords of the metadatas package json', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const packageJson = template.getMetadata().getPackageJson();
            packageJson.keywords = ['payment', 'car', 'automobile'];
            template.setPackageJson(packageJson);
            template.getMetadata().getKeywords().should.be.deep.equal(['payment', 'car', 'automobile']);
        });

        it('should find a specific keyword of the metadatas package json', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const packageJson = template.getMetadata().getPackageJson();
            packageJson.keywords = ['payment', 'car', 'automobile'];
            template.setPackageJson(packageJson);
            template.getMetadata().getKeywords()[2].should.be.equal('automobile');
        });

        it('should return empty array if no keywords exist', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            const packageJson = template.getMetadata().getPackageJson();
            packageJson.keywords = [];
            template.setPackageJson(packageJson);
            template.getMetadata().getKeywords().should.be.deep.equal([]);
        });
    });

    describe('#getLogic', () => {

        it('should return all Ergo scripts', async () => {
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            template.getScriptManager().getLogic().length.should.equal(1);
        });
    });

    describe('#accept', () => {

        it('should accept a visitor', async () => {
            const visitor = {
                visit: function(thing, parameters){}
            };
            const template = await Template.fromDirectory('./test/data/latedeliveryandpenalty');
            return (() => template.accept(visitor,{})).should.not.throw();
        });
    });
});