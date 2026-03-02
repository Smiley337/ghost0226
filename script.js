$(document).ready(function(){
  
  // 1. 햄버거 버튼 클릭 시 nav(메뉴 영역)를 옆으로 열기/닫기
  $('.menu-toggle').click(function(){
    let text;
    if (confirm("이 앞에는 심연이 존재합니다. 계속하시겠습니까?") == true) {
      alert("확인 되었습니다.");
      // 옆으로 밀리는 느낌을 주기 위해 slideToggle 사용
      $('nav').toggleClass('active');
} else {
  alert ("돌아가셨습니다.");
}

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
  
  // 4. [추가된 부분] 서브메뉴 클릭 시 비밀번호 묻기
  $('.SubMenu li a').click(function(e){
    e.preventDefault(); // 기본 링크 이동 방지
    
    // 사용자에게 비밀번호(이동할 파일명)를 입력받음
    let password = prompt("이 페이지를 보려면 비밀번호를 입력하세요:");
    
    if(password) {
      // 입력한 비밀번호를 파일명으로 사용하여 이동
      // 예: 'secret' 입력 시 'secret.html'로 이동
      window.location.href = password + ".html";
    }
  });
});

  document.getElementById("year").textContent = new Date().getFullYear();
