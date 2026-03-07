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

    // href에서 파일명만 추출 (확장자 제거)
    // 예: "menu5/k9mx2ptf.html" → "k9mx2ptf"
    const pageName = href.split('/').pop().replace('.html', '');

    if (LOCKED_PAGES.includes(pageName)) {
      // ★ 경로에서 폴더 부분 추출
      // 예: "menu5/k9mx2ptf.html" → "menu5"
      const parts = href.replace('.html', '').split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      const destPath = folder ? folder + '/' + pageName : pageName;

      // lock.html로 이동하면서 dest 전달 (확장자 없이)
      window.location.href = "lock.html?dest=" + destPath;
    } else {
      // 잠금 불필요 → 바로 이동
      window.location.href = href;
    }
  });

});
