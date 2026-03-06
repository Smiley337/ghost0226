$(document).ready(function(){

  // ── 메인 메뉴 클릭 시 서브 메뉴 슬라이드 토글 ──
  $('.MenuBar > li > a').click(function(e){
    e.preventDefault();
    e.stopPropagation();

    const $sub = $(this).next('.SubMenu');

    $('.SubMenu').not($sub).slideUp('fast');
    $sub.slideToggle('fast');
  });

  // ── 마우스 호버 시 색상 변경 ──
  $("li > a").hover(
    function() { $(this).addClass('selec'); },
    function() { $(this).removeClass('selec'); }
  );

  // =============================================
  //  ★ 잠금이 필요한 서브메뉴 설정 ★
  // =============================================
  const LOCKED_PAGES = [
    "k9mx2ptf",
    "r4nw7qvb",
    "j6tz3yhs",
    "w8ck5dxe",
    "b2fg9urn",
  ];

  // ── 서브메뉴 클릭 처리 (잠금 확인) ──
  $('.SubMenu li a').click(function(e){
    e.preventDefault();
    e.stopPropagation();

    const href = $(this).attr('href');
    if (!href || href === '#') return;

    const pageName = href.split('/').pop().replace('.html', '');

    if (LOCKED_PAGES.includes(pageName)) {
      // ★ URL 대신 sessionStorage에 목적지 저장 → 주소창에 안 보임
      sessionStorage.setItem('lockDest', 'menu5/' + pageName);
      window.location.href = 'lock.html';
    } else {
      window.location.href = href;
    }
  });

});
