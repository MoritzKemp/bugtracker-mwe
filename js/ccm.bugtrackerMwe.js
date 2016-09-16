/**
 * @overview
 * Welcome to the documentation of the bugtrackerMwe component.
 * This bugtracker is a component for the ccm-framework by Andre Kless.<br>
 * Landing page for ccm-developers [here]{@link https://akless.github.io/ccm-developer/}. <br>
 * API documentation of the ccm-framework [here]{@link https://akless.github.io/ccm-developer/api/ccm/index.html}. <br>
 * @author Moritz Kemp <moritz.kemp@smail.inf.h-brs.de>
 * @license MIT License
 * Copyright (c) 2016 Moritz Kemp
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the "Software"), to deal in 
 * the Software without restriction, including without limitation the rights to use, 
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the 
 * Software, and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/* Register given ccm-bugtracker component in ccm-framework */
ccm.component(
    
    /**
     * @lends ccm.components.bugtrackerMwe
     */
    {

        name: 'bugtrackerMwe',

        /**
         * Default component configuration.
         * @type {ccm.components.bugtrackerMwe.types.config}
         * @property {ccm.types.element} element    - ccm instance website area
         * @property {ccm.store} html               - Basic HTML-Template
         * @property {ccm.store} remoteStore        - Remote database configuration
         * @property {ccm.load} style               - CSS stylesheet
         * @property {ccm.load} icons               - Load remote icon fonts from cloudflare
         * @property {ccm.store} inputData          - Template for bug input mask, configures the input-ccm-component
         * @see [input-ccm-component documentation]{@link https://akless.github.io/ccm-components/api/input/}
         */
        config: {
            html: [ccm.store, {local: '../js/overviewTemplate.json'}],
            remoteStore: [ccm.store, {store: 'bugtracker2', url: 'http://ccm2.inf.h-brs.de/index.js'}],
            style:  [ccm.load, '../css/bug.css'],
            icons:  [ccm.load, 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.4.0/css/font-awesome.min.css'],
            inputData: {
                store: [ccm.store, '../js/input.json'],
                key: 'bugInput'
            },
            knockout: [ccm.load, 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js']
        },

        /**
         * @constructs ccm.components.bugtrackerMwe
         */
        Instance: function () {
            
            
            /**
             * Own context
             * @alias ccm.components.bugtrackerMwe#
             */
            var self = this;
            
            /**
             * Private members
             * @private
             */
            var my;

            /**
             * Called once before instanciation.
             * Privatizes remote store memeber to 
             * avoid manipulation after component instanciation.
             * @param {function} callback
             */
            self.init = function(callback){
                my = ccm.helper.privatize(self, 'remoteStore', 'knockout');
                if(callback) callback();
            };

            var Bug =  function(bug){
                this.key            = bug.key;
                this.bugId          = ko.observable(bug.bugId);
                this.name           = ko.observable(bug.name);
                this.subscriber     = ko.observable(bug.subscriber);
                this.color          = ko.observable(bug.color);
                this.description    = ko.observable(bug.description);
                this.state          = ko.observable(bug.state);
                this.priority       = ko.observable(bug.priority);
                this.edit           = ko.observable(false);
            };
            
            var BugOverviewViewModel = function(){
                that = this;
                that.bugs           = ko.observableArray([]);
                that.currentView    = ko.observable(0);
                that.bugSorting     = ko.observable(1);
                that.bugStates      = ko.observableArray(['open', 'pending', 'closed']);
                
                that.editBug = function(bug){
                    bug.edit(true);
                };
                
                that.approveChange = function(bug){
                    bug.edit(false);
                    self.storeBug(ko.toJS(bug));
                };
                
                that.editToggle = function(bug){
                    if(!bug.edit()) that.editBug(bug);
                    else if(bug.edit()) that.approveChange(bug);
                };
                
                that.removeBug = function(bug){
                    that.bugs.remove(bug);
                    self.removeBug(ko.toJS(bug));
                };
                
                that.submitNewBugHandler = function(data, event){
                    self.storeBug(event.bug);
                    that.bugs.push(new Bug(event.bug));
                    that.currentView(0);
                }
                
                that.sortBugs = function(){
                    
                    switch(that.bugSorting()) {
                        case -1: 
                            that.bugs.sort(function(a, b){
                                if(a.state() === "open" || b.state() === "closed") return -1;
                                else if(a.state === b.state) return 0;
                                else return 1;
                            });
                            break;
                        
                        case 1:
                            that.bugs.sort(function(a, b){
                                if(a.state() === "open" || b.state() === "closed") return 1;
                                else if(a.state() === b.state()) return 0;
                                else return -1;
                            });
                            break;
                    }
                    that.bugSorting(that.bugSorting()*-1);
                };
                
                that.renderInputView = function(){
                    self.inputComponent.render();
                    that.currentView(1);
                };
                
                that.renderOverview = function(){
                    that.currentView(0);
                };
                
                my.remoteStore.get(function(response){
                    var mappedBugs = $.map(response, function(elem){return new Bug(elem) });
                    that.bugs(mappedBugs);
                });
                
            };

            /**
             * Render bugtracker overview and set action handlers
             * @public
             */
            self.render = function (callback) {
                
                // Get own website area
                var element = ccm.helper.element(self);
                
                var container = $(ccm.helper.html(self.html.get('main')));
                element.html(container);
                
                ccm.instance(
                    'https://akless.github.io/ccm-components/resources/input/ccm.input.js',
                    {
                        element : ccm.helper.find(self, '.input-comp-area'),
                        data: self.inputData,
                        fieldset: 'Add bug',
                        onFinish: function(bug){
                            var index = (new Date()).getTime();
                            bug.bugId = index;
                            bug.key = index;

                            var event = $.Event('newBug', {'bug': bug});
                            ccm.helper.find(self, '.input-comp-area').trigger(event);
                        }               
                    },
                    function(instance){
                        self.inputComponent = instance;
                    }
                );
                
                ko.applyBindings(new BugOverviewViewModel());
                
                if(callback) callback();
            };

            /**
             * Public function to save given bug into remote database
             * @param {BugObject} bug Bug to be added to the bugtracker's database
             * @public
             */
            self.storeBug = function(bug){
                
                //create safe bug object
                var tempBug = {
                    key         : bug.key,
                    bugId       : bug.bugId,
                    name        : bug.name,
                    priority    : bug.priority,
                    subscriber  : bug.subscriber,
                    state       : bug.state,
                    description : bug.description,
                    color       : bug.color
                };
                
                //Prevent injection of scripts
                $.each(tempBug, function(index, value){
                    tempBug[index] = ccm.helper.noScript(value);
                });
                
                my.remoteStore.set(tempBug, function(response){
                    console.log(response);
                });
            };

            /**
             * Public function to remove given bug in remote database
             * @param {BugObject} bug Bug to be removed from the bugtracker's database
             * @public
             */
            self.removeBug = function (bug) {
                if (!bug.key) {
                    console.log('Bug not persisted yet. Skip delete request.');
                }
                else my.remoteStore.del(bug.key, function () {
                    console.log('Delete bug with key ' + bug.key);
                });
            };
 
    }
});

/**
 * JSON structure of a bug
 * @typedef {Object} BugObject - A single bug
 * @property {string} bugId - Unique bug index
 * @property {string} priority - Bug's priority, typical low or high
 * @property {string} context - URL or other description of context in which the bug appears
 * @property {string} subscriber - Person who reports the bug
 * @property {string} description -  Description of the bug
 * @property {string} name - Name of the bug, very short descritpion
 * @property {string} state - Current state of the bug, may be open, pending or closed
 * @example <caption> A valid bug object </caption>
 * {
 *  "bugId"         : "33de",
 *  "priority"      : "low",
 *  "context"       : "my specific url",
 *  "subscriber"    : "John Doe",
 *  "description"   : "My bug description",
 *  "name"          : "Short bug description",
 *  "state"         : "pending"
 * }
 */