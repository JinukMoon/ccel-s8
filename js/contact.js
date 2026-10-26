/* S8 Bold data — Contact page (round v6), like source/contact_us.html: the group photo, the lab name and the contact
   details, all from window.CCEL.contact. No map, no form. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();
  const k = C.contact;

  const img = $('#contact-photo');
  if (k.group_photo) { img.src = U.asset(k.group_photo); img.alt = `${k.lab_name || C.lab.name}: group photo`; }
  else $('#contact-fig').remove();
  $('#contact-lab').textContent = k.lab_name || C.lab.name;
  $('#contact-list').innerHTML = U.contactRows();

  U.renderFooter();
  U.settleHash();
})();
