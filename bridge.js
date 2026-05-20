/**
 * CivicTrack — Complaint Bridge
 * Shared persistence layer between report.html and admincomp.html
 * Include this script on BOTH pages before other scripts.
 *
 * Usage:
 *   CivicBridge.saveComplaint(complaintObj)   → called from report.html after form submit
 *   CivicBridge.loadComplaints()              → called from admincomp.html to get all complaints
 *   CivicBridge.updateComplaint(id, changes)  → called from admincomp.html for resolve/escalate
 */

var CivicBridge = (function () {

  var STORAGE_KEY = 'civictrack_complaints';

  /* ── Read all complaints from localStorage ── */
  function loadComplaints() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('CivicBridge: Failed to load complaints', e);
      return [];
    }
  }

  /* ── Write a new complaint (from report.html) ── */
  function saveComplaint(complaint) {
    try {
      /* Also keep sessionStorage in sync (for track1.html) */
      var session = JSON.parse(sessionStorage.getItem('userComplaints') || '[]');
      session.unshift(complaint);
      sessionStorage.setItem('userComplaints', JSON.stringify(session));

      /* Persist to localStorage so admin can see it */
      var all = loadComplaints();
      all.unshift(complaint);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

      return true;
    } catch (e) {
      console.warn('CivicBridge: Failed to save complaint', e);
      return false;
    }
  }

  /* ── Update an existing complaint (from admincomp.html) ── */
  function updateComplaint(id, changes) {
    try {
      /* Update localStorage (admin source of truth) */
      var all = loadComplaints();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) {
          for (var key in changes) {
            if (changes.hasOwnProperty(key)) {
              all[i][key] = changes[key];
            }
          }
          break;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

      /* Also sync sessionStorage so track.html / track1.html reflect changes */
      try {
        var session = JSON.parse(sessionStorage.getItem('userComplaints') || '[]');
        var found = false;
        for (var j = 0; j < session.length; j++) {
          if (session[j].id === id) {
            for (var key in changes) {
              if (changes.hasOwnProperty(key)) {
                session[j][key] = changes[key];
              }
            }
            found = true;
            break;
          }
        }
        /* If not in sessionStorage yet, pull the updated record from localStorage */
        if (!found) {
          var updated = all.filter(function(c) { return c.id === id; })[0];
          if (updated) {
            session.unshift(updated);
          }
        }
        sessionStorage.setItem('userComplaints', JSON.stringify(session));
      } catch (se) {
        console.warn('CivicBridge: Failed to sync sessionStorage', se);
      }

      return true;
    } catch (e) {
      console.warn('CivicBridge: Failed to update complaint', e);
      return false;
    }
  }

  /* ── Delete a complaint ── */
  function deleteComplaint(id) {
    try {
      var all = loadComplaints().filter(function (c) { return c.id !== id; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    saveComplaint:   saveComplaint,
    loadComplaints:  loadComplaints,
    updateComplaint: updateComplaint,
    deleteComplaint: deleteComplaint
  };

})();