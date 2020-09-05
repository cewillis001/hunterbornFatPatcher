/* global ngapp, xelib, registerPatcher, patcherUrl */


registerPatcher({
    info: info,
    // array of the game modes your patcher works with
    // see docs://Development/APIs/xelib/Setup for a list of game modes
    gameModes: [xelib.gmSSE],
    settings: {
        // The label is what gets displayed as the settings tab's label
        label: 'Hunterborn Fat Patcher',
        // if you set hide to true the settings tab will not be displayed
        //hide: true,
        templateUrl: `${patcherUrl}/partials/settings.html`,
        // controller function for your patcher's settings tab.
        // this is where you put any extra data binding/functions that you
        // need to access through angular on the settings tab.
        controller: function($scope) {
            let patcherSettings = $scope.settings.hunterbornFatPatcher;

            // function defined on the scope, gets called when the user
            // clicks the Show Message button via ng-click="showMessage()"
            $scope.showMessage = function() {
                alert(patcherSettings.fatMultiplier);
            };
        },
        // default settings for your patcher.  use the patchFileName setting if
        // you want to use a unique patch file for your patcher instead of the
        // default zPatch.esp plugin file.  (using zPatch.esp is recommended)
        defaultSettings: {
            exampleSetting: 'hello world',
            fatMultiplier: 3,
            patchFileName: 'examplePatch.esp'
        }
    },
    // optional array of required filenames.  can omit if empty.
    requiredFiles: ['Hunterborn.esp'],
    execute: (patchFile, helpers, settings, locals) => ({
        initialize: function() {
            locals.date = new Date();
            // Optional function, omit if empty.
            // Perform anything that needs to be done once at the beginning of the
            // patcher's execution here.  This can be used to cache records which don't
            // need to be patched, but need to be referred to later on.  Store values
            // on the locals variable to refer to them later in the patching process.
            helpers.logMessage(settings.fatMultiplier);
            locals.trollFatFormID = 0x0003AD72; // surely it would be better to not hardcode this
            // get hunterborn handle
            var hunterborn = xelib.FileByName('Hunterborn.esp');
            //lol will this work
            var animalFat = xelib.GetRecord(hunterborn, '_DS_Misc_AnimalFat');
            //'Hunterborn.esp\\_DS_Misc_AnimalFat'
            locals.animalFatFormID = xelib.GetFormID(animalFat);
        },
        // required: array of process blocks. each process block should have both
        // a load and a patch function.
        process: [
            {
                load: {
                    // get craftable ojects
                    signature: 'COBJ',
                    // filter out craftable objects that don't require troll fat
                    filter: function(record) {
                        var isFattyRecipe = xelib.HasItem(record, locals.trollFatFormID);
                        if (isFattyRecipe) {
                            helpers.logMessage(`I think ${xelib.GetFormID(record)} has troll fat as an ingredient`);
                        }
                        return (!isFattyRecipe);
                    }
                },
                patch: function(trollFatRecipe) {
                    // copy recipe
                    var animalFatRecipe = trollFatRecipe;
                    // rename
                    var oldEDID = xelib.GetElement(trollFatRecipe, 'EDID');
                    xelib.SetElementValue(animalFatRecipe, 'EDID', "BRY_FAT_PATCH_".concat(oldEDID);
                    // find troll fat
                    // I believe this is a handle, so changes I make here should automatically save to the record?
                    var fatItem = xelib.getItem(animalFatRecipe, locals.trollFatFormID);
                    // here's hoping the item handle refers both to the item and the count
                    xelib.SetValue(fatItem, 'CNTO\\Item', locals.animalFatFormID);
                    var oldCount = xelib.GetUIntValue(fatItem, 'CNTO\\Count');
                    xelib.SetUIntValue(ingredient, 'CNTO\\Count', oldCount * settings.fatMultiplier);
                    
                    // now add to the patch
                    xelib.AddElement(this.patchFile, animalFatRecipe);
                }
            }
        ],
        finalize: function() {
            let diff = new Date() - locals.date;
            let seconds = Math.round(diff / 1000);
            let minutes = Math.floor(seconds / 60);
            helpers.logMessage('Elapsed minutes:' + minutes);
            helpers.logMessage('Elapsed seconds:' + (seconds - (minutes * 60)));
        }
    })
});