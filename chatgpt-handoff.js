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
    note.textContent='This sends the '+options.context+' prompt to ChatGPT and copies the same prompt as a backup.';
    link.addEventListener('click',function(){
      copyText(options.prompt).then(function(){
        note.textContent='The '+options.context+' prompt was sent and copied as a backup.';
      }).catch(function(){
        note.textContent='The prompt was sent to ChatGPT. If the box is blank, return here and try again.';
      });
    });
    container.appendChild(link);container.appendChild(note);
  };
})();
