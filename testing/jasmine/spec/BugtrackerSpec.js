describe("Bugtracker ccm-component", function(){
    
    var bugtracker_local;
    
    //Remote store mockup
    var remoteStore = {
        get: function(){},
        set: function(){},
        del: function(){}
    }
    describe("when ccm-framework is ready", function(){
        beforeEach(function(done){
            ccm.instance('../js/ccm.bugtrackerMwe.js', 
            {
                element     : $('#component-wrapper'),
                remoteStore : remoteStore
            },
            function(bugtrackerInstance){
                bugtracker_local = bugtrackerInstance;
                done();
            });
        });
    
        it("should be able to create by the ccm framework local", function(){
            expect(bugtracker_local).not.toBe(null);
            expect(bugtracker_local).toBeDefined();
        });
        
        describe("when the bugtracker instance is ready", function(){
            
            //Test data
            var bugs = [
                {
                    "key"           : "11",
                    "bugId"         : "1",
                    "priority"      : "low",
                    "subscriber"    : "John Doe",
                    "description"   : "my bug description",
                    "name"          : "Bug No. 1",
                    "state"         : "open",
                    "color"         : ""
                },
                {
                    "key"           : "12",
                    "bugId"         : "2",
                    "priority"      : "high",
                    "description"   : "my bug description 2, somewhat a little bit longer.",
                    "subscriber"    : "Fred",
                    "name"          : "Bug No. 2",
                    "state"         : "pending",
                    "color"         : ""
                },
                {
                    "key"           : "13",
                    "bugId"         : "3",
                    "priority"      : "low",
                    "description"   : "my bug description 3, somewhat a little bit longer.",
                    "subscriber"    : "Nasenbär",
                    "name"          : "Bug No. 22",
                    "state"         : "closed",
                    "color"         : ""
                }
            ];    
            
            beforeEach(function(){
                //Setup remote database stub
                spyOn(remoteStore, "set");
                spyOn(remoteStore, "del");
                spyOn(remoteStore, "get");
            });
            
            it("should be able to add a new bug", function(){
                bugtracker_local.storeBug(bugs[0]);
                expect(remoteStore.set).toHaveBeenCalledWith(
                        bugs[0], 
                        jasmine.any(Function) // any callback, we dont care
                    );
            });
            
            it("should be able to remove a valid bug", function(){
                bugtracker_local.removeBug(bugs[0]);
                expect(remoteStore.del).toHaveBeenCalledWith(
                        bugs[0].key, 
                        jasmine.any(Function) // any callback, we dont care
                    );
            });
            
            it("should be able to remove a invalid bug", function(){
                var bugWithNoKey = {
                    "bugId"         : "3",
                    "priority"      : "low",
                    "description"   : "my bug description 3, somewhat a little bit longer.",
                    "subscriber"    : "Nasenbär",
                    "name"          : "Bug No. 22",
                    "state"         : "closed",
                    "color"         : ""
                }
                bugtracker_local.removeBug(bugWithNoKey);
                expect(remoteStore.del).not.toHaveBeenCalled();
            });
        });
    });
});

