/*
Copyright 2011 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Gets the |p| query parameter, assuming that it looks like a blobref.
function getPermanodeParam() {
    var blobRef = getQueryParam('p');
    return (blobRef && isPlausibleBlobRef(blobRef)) ? blobRef : null;
}

function handleFormTitleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    var inputTitle = document.getElementById("inputTitle");
    inputTitle.disabled = "disabled";
    var btnSave = document.getElementById("btnSave");
    btnSave.disabled = "disabled";

    var startTime = new Date();

    camliNewSetAttributeClaim(
        getPermanodeParam(),
        "title",
        inputTitle.value,
        {
            success: function() {
                var elapsedMs = new Date().getTime() - startTime.getTime();
                setTimeout(function() {
                    inputTitle.disabled = null;
                    btnSave.disabled = null;
                }, Math.max(250 - elapsedMs, 0));
            },
            fail: function(msg) {
                alert(msg);
                inputTitle.disabled = null;
                btnSave.disabled = null;
            }
        });
}

function handleFormTagsSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    var input = document.getElementById("inputNewTag");
    var btn = document.getElementById("btnAddTag");
    input.disabled = "disabled";
    btn.disabled = "disabled";

    var startTime = new Date();

    // TODO: split on /\s*,\s*/ first and add a tag for each
    // TODO: unifiy this code/timing logic with title above

    camliNewAddAttributeClaim(
        getPermanodeParam(),
        "tag",
        input.value,
        {
            success: function() {
                var elapsedMs = new Date().getTime() - startTime.getTime();
                setTimeout(function() {
                    input.disabled = null;
                    btn.disabled = null;
                }, Math.max(250 - elapsedMs, 0));
            },
            fail: function(msg) {
                alert(msg);
                input.disabled = null;
                btn.disabled = null;
            }
        });
}

// TODO: immediately <s>xxx</s> out xele, and after success remove removeele
function deleteTagFunc(tag, strikeEle, removeEle) {
    return function(e) {
        strikeEle.innerHTML = "<s>" + strikeEle.innerHTML + "</s>";
        camliNewDelAttributeClaim(
            getPermanodeParam(),
            "tag",
            tag,
            {
                success: function() {
                    removeEle.innerHTML = "";
                },
                fail: function(msg) {
                    alert(msg);
                }
            });
    };
}

window.addEventListener("load", function (e) {
    var permanode = getPermanodeParam();
    if (permanode) {
      document.getElementById('permanode').innerHTML = "<a href='./?p=" + permanode + "'>" + permanode + "</a>";
        document.getElementById('permanodeBlob').innerHTML = "<a href='./?b=" + permanode + "'>view blob</a>";
    }

    var formTitle = document.getElementById("formTitle");
    formTitle.addEventListener("submit", handleFormTitleSubmit);
    var formTags = document.getElementById("formTags");
    formTags.addEventListener("submit", handleFormTagsSubmit);

    camliDescribeBlob(permanode, {
        success: function(jres) {
            if (!jres[permanode]) {
                alert("didn't get blob " + permanode);
                return;
            }
            var permanodeObject = jres[permanode].permanode;
            if (!permanodeObject) {
                alert("blob " + permanode + " isn't a permanode");
                return;
            }

            var inputTitle = document.getElementById("inputTitle");
            inputTitle.value =
                (permanodeObject.attr.title && permanodeObject.attr.title.length == 1) ?
                permanodeObject.attr.title[0] :
                "";
            inputTitle.disabled = null;


            var spanTags = document.getElementById("spanTags");
            while (spanTags.firstChild) {
                spanTags.removeChild(spanTags.firstChild);
            }

            var tags = permanodeObject.attr.tag;
            for (idx in tags) {
                var tagSpan = document.createElement("span");

                if (idx > 0) {
                    tagSpan.appendChild(document.createTextNode(", "));
                }
                var tagLink = document.createElement("i");
                var tag = tags[idx];
                tagLink.innerText = tags[idx];
                tagSpan.appendChild(tagLink);
                tagSpan.appendChild(document.createTextNode(" ["));
                var delLink = document.createElement("a");
                delLink.href = '#';
                delLink.innerText = "X";
                delLink.addEventListener("click", deleteTagFunc(tag, tagLink, tagSpan));
                tagSpan.appendChild(delLink);
                tagSpan.appendChild(document.createTextNode("]"));

                spanTags.appendChild(tagSpan);
            }

            var btnSave = document.getElementById("btnSave");
            btnSave.disabled = null;
        },
        failure: function(msg) { alert("failed to get blob description: " + msg); }
    });
});
