/**
*   hashr Firefox Extension
*   @version: 2.0.0
*   @author Copyright 2008-2009 Rogerio Vicente, <http://rogeriopvl.com>
*
*   Report any bugs or suggestions to rogeriopvl ([at]) gmail
*
*   This file is part of hashr.
*
*   hashr is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   hashr is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with hashr.  If not, see <http://www.gnu.org/licenses/>.
*
*/
'use strict';

var hashrExtension = {

    prefs: null,

    lastUsedAlgo: null,

    init: function () {
        var firstRun = true;

        // get the extension preferences
        this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService);
        this.prefs = this.prefs.getBranch('extensions.hashr.');

        try {
            firstRun = this.getBoolPref('first_run');
        }
        catch(e) {}
        finally {
            if (firstRun) {
                this.prefs.setBoolPref('first_run', false);

                // add the hashr button to the toolbar
                var navToolbar = document.getElementById('nav-bar');
                navToolbar.insertItem('hashr-statusbarpanel');
                navToolbar.setAttribute('currentset', navToolbar.currentSet);
                document.persist('nav-bar', 'currentset');

                try {
                    BrowserToolboxCustomizeDone(true);
                }
                catch (e) {}
            }
        }

        // hide the hashr toolbar on start
        var tbar = document.getElementById('hashrToolbar');
        if (tbar) { tbar.collapsed = true; }

        try {
            this.lastUsedAlgo = this.prefs.getCharPref('last_used_algo');
        } catch (e) {
            this.lastUsedAlgo = 'md5'; // default
        }

        this.getAlgos();
    },

    makeRequest: function (method, url, params, cb) {
        params = params || null;

        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                cb(req.responseText, req.status);
            }
        };

        if (method === 'POST') {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        req.send(params);

        return req;
    },

    fillAlgos: function (algos) {
        var that = this;
        var menulist = document.getElementById('hashtype');
        var menupopup = document.createElement('menupopup');

        algos.forEach(function(item) {
            var opt = document.createElement('menuitem');
            opt.setAttribute('value', item);
            opt.setAttribute('label', item);
            if (item === this.lastUsedAlgo) {
                opt.setAttribute('selected', true);
                menulist.setAttribute('value', item);
                menulist.setAttribute('label', item);
            }
            menupopup.appendChild(opt);
        }.bind(this));
        menulist.appendChild(menupopup);
    },

    getAlgos: function () {
        var algosURL = 'http://hashr.rogeriopvl.com/api2/algos';
        this.makeRequest('GET', algosURL, null, function (data, status) {
            var algosList = JSON.parse(data);
            this.fillAlgos(algosList);
        }.bind(this));
    },

    makeHash: function () {
        var str = document.getElementById('hashrStr').value;
        var hashtype = document.getElementById('hashtype').value;
        var params = 'str=' + str + '&hashtype=' + hashtype + '&client_app=firefox';

        this.prefs.setCharPref('last_used_algo', hashtype);

        document.getElementById('hashrStr').setAttribute('size', '30');
        document.getElementById('hashrResult').setAttribute('value', 'Loading...');
        document.getElementById('hashrResult').setAttribute('hidden', 'false');
        document.getElementById('hashrClipboard').setAttribute('hidden', 'false');

        var remoteURL = 'http://hashr.rogeriopvl.com/api2/hash';

        this.makeRequest('POST', remoteURL, params, function(data, status) {
            if (status === 200) {
                document.getElementById('hashrResult').setAttribute('value', data);
            } else { // error case
                document.getElementById('hashrResult').setAttribute(
                    'value',
                    'Error contacting server, please retry.'
                );
            }
        });
    },

    //adds the calculated hash to the clipboard
    addToClipboard: function() {
        const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
            getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(document.getElementById('hashrResult').value);
        hashrExtension.showCopied();
    },

    // show a copied message in the toolbar
    showCopied: function() {
        var copiedLabel = document.getElementById('copied');
        if (copiedLabel) { return false; }

        var copyContainer = document.getElementById('copyContainer');
        var newElement = document.createElement('label');
        newElement.setAttribute('id', 'copied');
        newElement.setAttribute('value', 'Copied!');
        copyContainer.appendChild(newElement);

        // only show the copied message for 4 seconds
         window.setTimeout(function(){
             var element = document.getElementById('copied');
             if(element){
                 element.parentNode.removeChild(element);
             }
         }, 4000);
    },

    //gets the toolbar to it's initial state (this is actually a fix)
    resetToolbar: function() {
        document.getElementById('hashrStr').setAttribute('size', '80');
        document.getElementById('hashrResult').setAttribute ('value', '');
        document.getElementById('hashrResult').setAttribute ('hidden', 'true');
        document.getElementById('hashrClipboard').setAttribute('hidden', 'true');
    },

    // shows / hides the hashr toolbar
    toggleShow: function() {
        var tbar = document.getElementById('hashrToolbar');
        if (tbar.collapsed == true)
            tbar.collapsed = false;
        else {
            tbar.collapsed = true;
            hashrExtension.resetToolbar();
        }
    },
};
window.addEventListener('load', function() { hashrExtension.init(); }, false);
