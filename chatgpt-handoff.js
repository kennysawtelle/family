(function(){
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    const field=document.createElement('textarea');
    field.value=text;field.readOnly=true;field.style.position='fixed';field.style.opacity='0';
    document.body.appendChild(field);field.select();document.execCommand('copy');field.remove();
    return Promise.resolve();
  }

  window.addChatGptResearchLink=function(options){
    const container=typeof options.container==='string'?document.getElementById(options.container):options.container;
    if(!container)return;
    const link=document.createElement('a');
    link.textContent=options.label+' ↗';
    link.href='https://chatgpt.com/?temporary-chat=true&hints=search&q='+encodeURIComponent(options.prompt);
    link.target='_blank';link.rel='noopener noreferrer';
    const note=document.createElement('p');
    note.className='chatgpt-handoff-note';
    note.hidden=true;
    link.addEventListener('click',function(){
      copyText(options.prompt).then(function(){
        note.hidden=false; note.textContent=options.context+' prompt copied.';
      }).catch(function(){
        note.hidden=false; note.textContent='Could not copy the '+options.context+' prompt.';
      });
    });
    container.appendChild(link);container.appendChild(note);
  };
})();
