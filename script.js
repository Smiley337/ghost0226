$(document).ready(function(){
  
  // 1. 햄버거 버튼 클릭 시 nav(메뉴 영역)를 옆으로 열기/닫기
  $('.menu-toggle').click(function(){
    if (confirm("이 앞에는 심연이 존재합니다. 계속하시겠습니까?") == true) {
      alert("확인 되었습니다.");
      $('nav').toggleClass('active');
    } else {
      alert("돌아가셨습니다.");
    }
  });

  // 메인 메뉴 클릭 시 서브 메뉴 슬라이드
  $('.MenuBar > li > a').click(function(e){
    e.preventDefault();
    $(this).next('.SubMenu').slideToggle('fast');
  });

  // 마우스 호버 시 색상 변경
  $("li > a").hover(
    function() { $(this).addClass('selec'); },
    function() { $(this).removeClass('selec'); }
  );
  
  // =============================================
  //  ★ 잠금이 필요한 서브메뉴 설정 ★
  //  href에 실제 파일명을 넣고, 잠금할 파일명을 아래 배열에 추가
  // =============================================
  const LOCKED_PAGES = [
    "submenu01",
    "submenu02",
    // 여기에 잠금할 페이지 파일명(확장자 제외)을 추가
  ];

  // 서브메뉴 클릭 처리
  $('.SubMenu li a').click(function(e){
    e.preventDefault();

    // href에서 파일명 추출 (예: "submenu01.html" → "submenu01")
    const href = $(this).attr('href');
    const pageName = href.replace('.html', '');

    if (LOCKED_PAGES.includes(pageName)) {
      // 잠금 페이지가 필요한 경우 → lock.html로 이동하면서 목적지 전달
      window.location.href = "lock.html?dest=" + pageName;
    } else {
      // 잠금 불필요한 페이지 → 바로 이동
      window.location.href = href;
    }
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
