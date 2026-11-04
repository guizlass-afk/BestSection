(() => {
  'use strict';
  // Small PDF image writer: all processing stays on the device, without a service.
  function encode(pages) {
    const encoder=new TextEncoder(),chunks=[],offsets=[0];let size=0;
    const write=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);size+=bytes.length;};
    const object=(id,body)=>{offsets[id]=size;write(`${id} 0 obj\n${body}\nendobj\n`);};
    write('%PDF-1.4\n');
    object(1,'<< /Type /Catalog /Pages 2 0 R >>');
    object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
    pages.forEach((page,i)=>{
      const id=3+i*3,{width,height,pixelsW,pixelsH,jpeg}=page;
      object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Map ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
      offsets[id+1]=size;
      write(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelsW} /Height ${pixelsH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
      write(jpeg);write('\nendstream\nendobj\n');
      const content=`q ${width} 0 0 ${height} 0 0 cm /Map Do Q`;
      object(id+2,`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    });
    const xref=size,count=3+pages.length*3;
    write(`xref\n0 ${count}\n0000000000 65535 f \n`);
    for(let i=1;i<count;i++)write(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
    write(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks,{type:'application/pdf'});
  }
  async function sheetPage(svg,{title,project,details,legend,index,total}) {
    const landscape=svg.viewBox.baseVal.width>=svg.viewBox.baseVal.height;
    const width=landscape?841.89:595.28,height=landscape?595.28:841.89,scale=300/72;
    const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
    const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    const margin=28,available=width-margin*2;
    ctx.fillStyle='#1c333f';ctx.font='bold 16px Arial';ctx.fillText(title,margin,margin+16,available);
    ctx.font='10px Arial';ctx.fillText(project,margin,margin+34,available);ctx.fillText(details,margin,margin+50,available);
    const columns=3,rows=Math.ceil(legend.length/columns),rowHeight=Math.min(16,(height*.24)/Math.max(rows,1)),legendHeight=rows*rowHeight;
    const top=margin+64,bottom=height-margin-20-legendHeight,mapHeight=bottom-top;
    const view=svg.viewBox.baseVal,ratio=Math.min(available/view.width,mapHeight/view.height),w=view.width*ratio,h=view.height*ratio;
    const copy=svg.cloneNode(true),originals=[svg,...svg.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-dasharray','opacity','font-family','font-size','font-weight','text-anchor','dominant-baseline','paint-order','stroke-linejoin'];
    originals.forEach((element,i)=>{
      const style=getComputedStyle(element);
      properties.forEach(key=>copies[i].style.setProperty(key,style.getPropertyValue(key)));
      if(style.getPropertyValue('vector-effect')==='non-scaling-stroke'){
        copies[i].style.setProperty('stroke-width',String(parseFloat(style.strokeWidth)/ratio));
        copies[i].style.setProperty('vector-effect','none');
      }
    });
    copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',String(Math.ceil(w*scale)));copy.setAttribute('height',String(Math.ceil(h*scale)));
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}));
    try {
      const image=new Image();image.src=url;await image.decode();ctx.drawImage(image,margin+(available-w)/2,top+(mapHeight-h)/2,w,h);
    } finally {URL.revokeObjectURL(url);}
    const colWidth=available/columns;
    legend.forEach((entry,i)=>{
      const x=margin+(i%columns)*colWidth,y=bottom+14+Math.floor(i/columns)*rowHeight,font=Math.min(9,rowHeight*.7);
      ctx.fillStyle=entry.color;ctx.fillRect(x,y-font,font,font);ctx.fillStyle='#344b55';ctx.font=`${font}px Arial`;ctx.fillText(entry.text,x+font+5,y,colWidth-font-12);
    });
    ctx.fillStyle='#526770';ctx.font='9px Arial';ctx.fillText('BestSection',margin,height-16);ctx.textAlign='right';ctx.fillText(`${index} / ${total}`,width-margin,height-16);
    const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.97).split(',')[1]),c=>c.charCodeAt(0));
    return {width,height,pixelsW:canvas.width,pixelsH:canvas.height,jpeg};
  }
  window.BestSectionPDF=Object.freeze({encode,sheetPage});
})();
