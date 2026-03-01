$(document).ready(function(){
  
  // 1. 햄버거 버튼 클릭 시 nav(메뉴 영역)를 옆으로 열기/닫기
  $('.menu-toggle').click(function(){
    // 옆으로 밀리는 느낌을 주기 위해 slideToggle 사용
    $('nav').toggleClass('active');
  });

  //  메인 메뉴 클릭 시 서브 메뉴 슬라이드
  $('.MenuBar > li > a').click(function(e){
    e.preventDefault(); // 클릭 시 페이지 상단으로 튕기는 현상 방지
    $(this).next('.SubMenu').slideToggle('fast');
  });

  // 2. 마우스 호버 시 색상 변경 (기존 코드 유지)
  $("li > a").hover(
    function() { $(this).addClass('selec'); }, // 마우스가 버튼 위에 올라갔을 때
    function() { $(this).removeClass('selec'); }// 마우스가 버튼에서 떠났을 때
  );
  
});
