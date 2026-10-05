(function(){
  "use strict";

  const data=window.NetizensData;
  if(!data) throw new Error("NetizensData must load before participation-ui");

  const placeView=document.getElementById("placeView");
  const notificationPanel=document.getElementById("notificationPanel");
  const openNotifications=document.getElementById("openNotifications");
  let currentEntityId=null;
  let replyToId=null;

  function escapeHtml(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char];
    });
  }

  function provenanceLabel(item){
    if(item.provenance==="seeded") return "<span class='discussion-provenance seeded'>SEEDED</span>";
    if(item.provenance==="demo") return "<span class='discussion-provenance demo'>DEMO</span>";
    return "";
  }

  function discussionItemMarkup(item,depth){
    const moderated=item.moderationState && item.moderationState!=="visible";
    const removed=item.moderationState==="removed" || item.deletedAt;
    const body=moderated||removed ? "<p class='moderated-copy'>MODERATED</p>" : "<p>"+escapeHtml(item.body)+"</p>";
    return "<article class='discussion-item"+(depth?" reply":"")+"' data-discussion-id='"+escapeHtml(item.id)+"'>"
      +"<div class='discussion-meta'><span>"+(depth?"REPLY":"CITIZEN")+"</span>"+provenanceLabel(item)+"</div>"
      +body
      +(!removed && !moderated ? "<button class='discussion-reply' data-discussion-reply='"+escapeHtml(item.id)+"'>REPLY</button>" : "")
      +"</article>";
  }

  function renderEntityDiscussion(entity){
    if(!placeView || !entity) return;
    const existing=placeView.querySelector(".entity-participation");
    if(existing) existing.remove();

    const section=document.createElement("section");
    section.className="panel entity-participation";

    if(entity.placeId==="circles"){
      section.innerHTML="<div class='entity-discussion private-boundary'><p class='kicker'>PRIVATE CONVERSATION</p><h3>Conversation stays inside the Circle.</h3><p class='muted'>Public entity discussion is disabled here. Circle messaging uses the separate trusted conversation system.</p></div>";
      placeView.appendChild(section);
      return;
    }

    const items=data.listDiscussion(entity.id)||[];
    const byParent=new Map();
    for(const item of items){
      const key=item.parentId||null;
      if(!byParent.has(key)) byParent.set(key,[]);
      byParent.get(key).push(item);
    }

    let discussion="";
    const roots=byParent.get(null)||[];
    for(const root of roots){
      discussion+=discussionItemMarkup(root,0);
      const replies=byParent.get(root.id)||[];
      for(const reply of replies) discussion+=discussionItemMarkup(reply,1);
    }
    const rootedIds=new Set(roots.map(function(item){return item.id;}));
    for(const item of items){
      if(item.parentId && !rootedIds.has(item.parentId)) discussion+=discussionItemMarkup(item,1);
    }

    const replyTarget=replyToId ? items.find(function(item){return item.id===replyToId;}) : null;
    section.innerHTML="<div class='entity-discussion'>"
      +"<div class='discussion-heading'><div><p class='kicker'>DISCUSSION</p><h3>Participate here.</h3></div><span>"+items.length+"</span></div>"
      +(discussion||"<p class='muted discussion-empty'>No discussion yet. Start it.</p>")
      +"<div class='discussion-composer' data-discussion-composer='"+escapeHtml(entity.id)+"'>"
        +(replyTarget?"<div class='reply-target'>Replying to: "+escapeHtml(replyTarget.body||"moderated item")+" <button data-discussion-reply-cancel>×</button></div>":"")
        +"<textarea rows='3' maxlength='5000' data-discussion-body placeholder='Add something useful…'></textarea>"
        +"<button class='place-action' data-discussion-compose='"+escapeHtml(entity.id)+"'>POST</button>"
      +"</div>"
    +"</div>";
    placeView.appendChild(section);
  }

  function renderNotifications(){
    if(!notificationPanel) return;
    const list=data.listNotifications()||[];
    const unread=list.filter(function(item){return !item.readAt;}).length;
    if(openNotifications){
      openNotifications.dataset.unread=String(unread);
      openNotifications.classList.toggle("has-unread",unread>0);
      openNotifications.setAttribute("aria-label",unread?"Notifications, "+unread+" unread":"Notifications");
    }
    const target=notificationPanel.querySelector(".notification-list");
    if(!target) return;
    target.innerHTML=list.length ? list.map(function(item){
      const label=item.payload && (item.payload.title||item.payload.body||item.payload.message) || item.type || "Activity";
      return "<article class='notification-item"+(item.readAt?" read":"")+"'>"
        +"<div><strong>"+escapeHtml(label)+"</strong><small>"+escapeHtml(item.type||"activity")+"</small></div>"
        +(!item.readAt?"<button data-notification-read='"+escapeHtml(item.id)+"'>MARK READ</button>":"<span>READ</span>")
      +"</article>";
    }).join("") : "<p class='muted'>Nothing new. Notifications stay useful, not endless.</p>";
  }

  function openNotificationPanel(){
    document.querySelectorAll(".side-panel.open").forEach(function(panel){
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden","true");
    });
    renderNotifications();
    notificationPanel.classList.add("open");
    notificationPanel.setAttribute("aria-hidden","false");
  }

  document.addEventListener("click",function(event){
    const reply=event.target.closest("[data-discussion-reply]");
    if(reply){
      replyToId=reply.dataset.discussionReply;
      const entity=currentEntityId && data.getEntity(currentEntityId);
      if(entity) renderEntityDiscussion(entity);
      const textarea=placeView.querySelector("[data-discussion-body]");
      if(textarea) textarea.focus();
      return;
    }

    if(event.target.closest("[data-discussion-reply-cancel]")){
      replyToId=null;
      const entity=currentEntityId && data.getEntity(currentEntityId);
      if(entity) renderEntityDiscussion(entity);
      return;
    }

    const compose=event.target.closest("[data-discussion-compose]");
    if(compose){
      const entityId=compose.dataset.discussionCompose;
      const composer=compose.closest(".discussion-composer");
      const textarea=composer && composer.querySelector("[data-discussion-body]");
      const body=textarea ? textarea.value.trim() : "";
      if(!body) return;
      data.createDiscussionItem({entityId:entityId,body:body,parentId:replyToId,provenance:"genuine"});
      replyToId=null;
      const entity=data.getEntity(entityId);
      if(entity) renderEntityDiscussion(entity);
      return;
    }

    const notificationRead=event.target.closest("[data-notification-read]");
    if(notificationRead){
      data.markNotificationRead(notificationRead.dataset.notificationRead);
      renderNotifications();
      return;
    }
  });

  if(openNotifications) openNotifications.addEventListener("click",openNotificationPanel);

  window.addEventListener("netizens:analytics",function(event){
    const detail=event.detail||{};
    if(detail.event!=="entity_view") return;
    currentEntityId=detail.entity_id||null;
    replyToId=null;
    const entity=currentEntityId && data.getEntity(currentEntityId);
    if(entity) renderEntityDiscussion(entity);
  });

  window.addEventListener("netizens:state",function(){
    renderNotifications();
  });

  const exitWorld=document.getElementById("exitWorld");
  if(exitWorld) exitWorld.addEventListener("click",function(){
    if(notificationPanel){
      notificationPanel.classList.remove("open");
      notificationPanel.setAttribute("aria-hidden","true");
    }
  });

  renderNotifications();
})();