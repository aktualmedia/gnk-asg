document.addEventListener('DOMContentLoaded', function () {
  var financials = document.querySelector('#financials .kpi-grid');
  var group = document.querySelector('#grupa .group-kpis');
  if (financials) {
    var audit = document.createElement('div');
    audit.className = 'financial-document-strip';
    audit.id = 'audit-document-strip';
    audit.textContent = 'Izvješće neovisnog revizora i financijski izvještaji 2025. - GNK ASG d.o.o.';
    financials.parentNode.insertBefore(audit, financials.nextSibling);
  }
  if (group) {
    var filed = document.createElement('div');
    filed.className = 'financial-document-strip';
    filed.id = 'group-document-strip';
    filed.textContent = 'Konsolidirani financijski izvještaji grupe za 2025. - GNK DINAMO Ltd. - Filed in Colorado';
    group.parentNode.insertBefore(filed, group.nextSibling);
  }
});
