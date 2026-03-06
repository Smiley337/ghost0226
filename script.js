$(document).ready(function(){

  // ── 메인 메뉴 클릭 시 서브 메뉴 슬라이드 토글 ──
  // stopPropagation: 클릭 이벤트가 부모로 전파되는 걸 막아줘
  // (이게 없으면 다른 이벤트랑 충돌해서 열자마자 닫힘)
  $('.MenuBar > li > a').click(function(e){
    e.preventDefault();
    e.stopPropagation();

    const $sub = $(this).next('.SubMenu');

    // 다른 열려있는 서브메뉴는 닫고, 클릭한 것만 토글
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
  //  잠금할 파일명(확장자 제외)을 아래 배열에 추가
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

    // href에서 파일명만 추출 (폴더 경로 포함 가능)
    // 예: "menu5/k9mx2ptf.html" → "k9mx2ptf"
    const pageName = href.split('/').pop().replace('.html', '');

    if (LOCKED_PAGES.includes(pageName)) {
      // 잠금 페이지 → lock.html으로 이동하면서 목적지 전달
      window.location.href = "lock.html?dest=menu5/" + pageName;
    } else {
      // 잠금 불필요 → 바로 이동
      window.location.href = href;
    }
  });

});
