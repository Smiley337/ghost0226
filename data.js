/* ==========================================================
   data.js : 홈페이지 내용 파일
   ----------------------------------------------------------
   이 파일은 editor.html (편집기)에서 만들었어요.
   내용을 바꾸려면 editor.html 을 열어서 고치고 다시 저장하면 돼요.
     (editor.html 은 이 파일과 같은 폴더에 두면 자동으로 불러와요)
   직접 고쳐도 괜찮아요. 따옴표 "" 안의 글자만 바꿔 주세요.
   ========================================================== */

window.SITE = {
  "mobileWidth": 820,
  "title": "OUR HOME",
  "colors": {
    "point": "#2b2b2b",
    "background": "",
    "backgroundTop": "",
    "logo": "",
    "menuText": "",
    "menuHover": "",
    "menuNumber": "",
    "menuLine": "",
    "frameBackground": "",
    "frameBorder": "",
    "frameShadow": "",
    "placeholder": "",
    "placeholderText": "",
    "objectShadow": "",
    "player": {
      "background": "",
      "border": "",
      "title": "",
      "subText": "",
      "playButton": "",
      "playIcon": "",
      "bar": "",
      "barEmpty": "",
      "disc": ""
    },
    "pages": {
      "all": {
        "point": "",
        "title": "",
        "text": "",
        "sub": "",
        "line": "",
        "soft": "",
        "accent": "",
        "accentText": "",
        "card": "",
        "background": ""
      },
      "oc": {
        "point": "",
        "title": "",
        "text": "",
        "sub": "",
        "line": "",
        "soft": "",
        "accent": "",
        "accentText": "",
        "card": "",
        "background": ""
      },
      "pair": {
        "point": "",
        "title": "",
        "text": "",
        "sub": "",
        "line": "",
        "soft": "",
        "accent": "",
        "accentText": "",
        "card": "",
        "background": ""
      },
      "owner": {
        "point": "",
        "title": "",
        "text": "",
        "sub": "",
        "line": "",
        "soft": "",
        "accent": "",
        "accentText": "",
        "card": "",
        "background": ""
      },
      "guest": {
        "point": "",
        "title": "",
        "text": "",
        "sub": "",
        "line": "",
        "soft": "",
        "accent": "",
        "accentText": "",
        "card": "",
        "background": ""
      }
    }
  },
  "bgImage": {
    "image": "",
    "type": "cover",
    "patternSize": 200,
    "position": "center",
    "opacity": 0.2,
    "blur": 0,
    "grayscale": false,
    "fadeBottom": true,
    "scroll": false
  },
  "logo": {
    "image": "",
    "text": "COUPLE\nNAME",
    "size": 300
  },
  "illust": {
    "image": "",
    "frame": true,
    "shadow": true,
    "size": 600
  },
  "menu": [
    {
      "name": "Oc",
      "link": "#oc"
    },
    {
      "name": "Pair",
      "link": "#pair"
    },
    {
      "name": "Owner",
      "link": "#owner"
    },
    {
      "name": "Guest",
      "link": "#guest"
    }
  ],
  "music": {
    "enable": true,
    "autoplay": false,
    "volume": 0.5,
    "list": [
      {
        "title": "노래 제목 1",
        "artist": "아티스트",
        "file": "",
        "cover": ""
      },
      {
        "title": "노래 제목 2",
        "artist": "아티스트",
        "file": "",
        "cover": ""
      }
    ]
  },
  "calendar": {
    "enable": true,
    "position": "right-top",
    "folded": false,
    "weekStart": 0,
    "upcoming": 2,
    "events": [
      {
        "date": "08-13",
        "title": "라이칸 생일",
        "yearly": false
      },
      {
        "date": "2018-12-04",
        "title": "LILEY 기념일",
        "yearly": true
      }
    ],
    "counters": [
      {
        "date": "2018-12-04",
        "title": "LILEY"
      }
    ],
    "countFromOne": true
  },
  "oc": {
    "title": "OC",
    "subtitle": "Original Characters",
    "listGrayscale": true,
    "fadeTime": 1.2,
    "bgStanding": true,
    "bgStandingOpacity": 0.12,
    "list": [
      {
        "id": "smiley",
        "name": "스마일리",
        "en": "SMILEY",
        "tag": "No.01",
        "subtitle": "마법의 탑의 주인, 불멸자.",
        "desc": "???년간 세상의 변화를 보아온 몇 안되는 인물 중 하나. 마탑을 최소 100년간 유지한 장본인.",
        "thumb": "",
        "standingSize": 920,
        "color": "#0068c6",
        "standing": [
          {
            "label": "기본",
            "image": "",
            "thumb": ""
          },
          {
            "label": "AU",
            "image": "",
            "thumb": "",
            "tag": "No.01 · AU",
            "subtitle": "AU 한 줄 소개가 들어갑니다",
            "desc": "AU 설명이 들어갑니다.",
            "badge": {
              "image": "",
              "title": "AU 진영",
              "sub": "AU 에서의 소속"
            },
            "tabs": [
              {
                "name": "AU 설정",
                "sections": [
                  {
                    "title": "세계관",
                    "en": "WORLD",
                    "text": "AU 세계관이 들어갑니다."
                  },
                  {
                    "title": "성격",
                    "en": "CHARACTER",
                    "text": "AU 에서의 성격이 들어갑니다."
                  }
                ]
              }
            ]
          },
          {
            "label": "성장",
            "image": "",
            "thumb": "",
            "tag": "No.01 · 성장 후",
            "subtitle": "성장한 모습의 한 줄 소개",
            "stats": [
              {
                "name": "근력",
                "value": 85
              },
              {
                "name": "민첩",
                "value": 90
              },
              {
                "name": "지능",
                "value": 75
              },
              {
                "name": "매력",
                "value": 80
              },
              {
                "name": "운",
                "value": 55
              }
            ],
            "tabs": [
              {
                "name": "프로필",
                "sections": [
                  {
                    "title": "기본 정보",
                    "en": "INFORMATION",
                    "rows": [
                      [
                        "나이",
                        "00세"
                      ],
                      [
                        "키",
                        "000cm"
                      ]
                    ]
                  },
                  {
                    "title": "성격",
                    "en": "CHARACTER",
                    "text": "성장 후의 성격이 들어갑니다."
                  }
                ]
              }
            ]
          }
        ],
        "stats": [
          {
            "name": "근력",
            "value": 60
          },
          {
            "name": "민첩",
            "value": 90
          },
          {
            "name": "지능",
            "value": 98
          },
          {
            "name": "매력",
            "value": 40
          },
          {
            "name": "운",
            "value": 80
          }
        ],
        "faction": "마법의 탑",
        "badge": {
          "image": "",
          "title": "진영 A",
          "sub": "진영 설명",
          "size": 160
        },
        "tabs": [
          {
            "name": "프로필",
            "sections": [
              {
                "title": "기본 정보",
                "en": "INFORMATION",
                "rows": [
                  [
                    "성별",
                    "여성"
                  ],
                  [
                    "나이",
                    "???세"
                  ],
                  [
                    "키",
                    "167cm"
                  ],
                  [
                    "생일",
                    "??월 ??일"
                  ],
                  [
                    "좋아하는 것",
                    "내용"
                  ],
                  [
                    "싫어하는 것",
                    "내용"
                  ]
                ],
                "text": "100년 이상 마법의 탑의 주인으로 살아왔으며, 현재의 삶을 꽤나 즐기는 인물입니다. 보기와 달리 업무를 귀찮아하고 싫어하며, 집순이지만 사람을 좋아하는 모순을 가지고 있습니다."
              },
              {
                "title": "성격",
                "en": "CHARACTER",
                "text": "겉잡을수 없으나, 초월체 중에서는 꽤나 단순한 편에 속한다. 의래 초월체들이 그렇듯, 어딘가 어린이 같은 모습이 있으며, 좋아하고 안좋아하는 사람에게 태도의 차이가 명확하다. 기준도 꽤나 관대하며 단순한편. "
              },
              {
                "title": "배경",
                "en": "BACKGROUND",
                "text": "[열람 불가]"
              }
            ],
            "auto": false
          },
          {
            "name": "관계",
            "auto": true,
            "sections": [
              {
                "title": "",
                "en": "",
                "text": "관계에 대한 추가 설명이 들어갑니다."
              }
            ]
          },
          {
            "name": "비밀설정",
            "sections": [
              {
                "title": "비밀설정",
                "en": "SECRET",
                "text": "차원 이동이 주요 능력이며, 이에 따라 다른 시간선/세계선에서의 본인을 불러와 싸울수있습니다. 스마일리 또한 다른 시간선으로 넘어가 개입할수 있으며, 다른 초월체와 마찬가지로 현재 세계에 큰 개입을 하지 않습니다."
              }
            ]
          },
          {
            "name": "갤러리",
            "sections": [
              {
                "title": "",
                "en": "",
                "columns": 3,
                "images": [
                  {
                    "image": "",
                    "caption": "그림 설명 1"
                  },
                  {
                    "image": "",
                    "caption": "그림 설명 2"
                  },
                  {
                    "image": "",
                    "caption": "그림 설명 3"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "lykan",
        "name": "라이칸",
        "en": "LYKAN",
        "tag": "No.02",
        "subtitle": "???년간 살아온 식인.",
        "desc": "???년간 스마일리의 마력을 나눠 받아 어디선가 살아온 식인. 그로 인해 죽을수도 없는 몸이 되어 의도치 않게 불멸체로 살아왔다.",
        "thumb": "",
        "standingSize": 920,
        "color": "#3d3d83",
        "standing": [
          {
            "label": "기본",
            "image": "",
            "thumb": ""
          },
          {
            "label": "새 버전",
            "image": "",
            "thumb": ""
          },
          {
            "label": "새 버전",
            "image": "",
            "thumb": ""
          }
        ],
        "stats": [
          {
            "name": "근력",
            "value": 90
          },
          {
            "name": "민첩",
            "value": 50
          },
          {
            "name": "허기",
            "value": 100
          },
          {
            "name": "???",
            "value": 100
          }
        ],
        "faction": "마탑",
        "badge": {
          "image": "",
          "title": "",
          "sub": "",
          "size": 160
        },
        "tabs": [
          {
            "name": "프로필",
            "sections": [
              {
                "title": "기본 정보",
                "en": "INFORMATION",
                "text": "???년간 반강제로 살아온, 단순히 보면 가장 짐승같은 인물입니다. 보기와는 달리 잔머리가 잘 굴러가며, 예상치 못한 부분에서의 지능을 보여줄수있습니다. 식인 행위를 즐기는것보다 생존을 목적으로 하며, 의외의 <s>꼴초</s>애연가입니다.",
                "rows": [
                  [
                    "성별",
                    "남성"
                  ],
                  [
                    "나이",
                    "???살"
                  ],
                  [
                    "키",
                    "200?cm"
                  ],
                  [
                    "생일",
                    "08월 13일"
                  ],
                  [
                    "좋아하는 것",
                    "음식"
                  ],
                  [
                    "싫어하는 것",
                    "전기 충격"
                  ]
                ]
              },
              {
                "title": "성격",
                "en": "CHARACTER",
                "text": "과묵한 인물입니다. 필요하지 않을때는 굳이 말이나 행동을 취하지 않으며, 밥만 잘 먹여준다면 좋은 고기 방패가 되어줄것입니다."
              },
              {
                "title": "배경",
                "en": "BACKGROUND",
                "text": "스마일리와 같은 고아원 출신으로, 스마일리가 떠난 이후에도 고아원에 오랫동안 남아있었습니다. 재정문제와 더불어 고아원이 버려졌을때 마지막까지 살아남은 몇 안되는 인물이였으며, 첫 식인은 당시 음식이 부족했을때 선택권이 없는 상태였습니다. "
              }
            ]
          },
          {
            "name": "관계",
            "auto": true
          },
          {
            "name": "비밀 설정",
            "sections": [
              {
                "title": "비밀 설정",
                "en": "SECRET INFORMATION",
                "text": "???년간 살아오며 평생을 노숙 식인으로서 살아온것은 아니였습니다. 수년간 특정 단체에 의해 단단한 몸둥아리와 식인이라는 점으로 연구와 실험을 당했으며, 그때의 트라우마로 전기 충격을 굉장히 싫어하고 두려워합니다."
              }
            ]
          }
        ]
      }
    ]
  },
  "pair": {
    "title": "Pair",
    "subtitle": "Couples & Pairs",
    "fadeTime": 1.2,
    "coverTab": "Cover",
    "scriptFont": "Pinyon",
    "list": [
      {
        "id": "liley",
        "name": "라일리",
        "en": "LILEY",
        "thumb": "",
        "relation": "연인?",
        "color": "",
        "members": [
          "smiley",
          "lykan"
        ],
        "portraits": [
          "",
          ""
        ],
        "standingSize": 860,
        "standings": [
          {
            "label": "기본",
            "image": ""
          },
          {
            "label": "AU",
            "image": "",
            "script": "AU Name"
          },
          {
            "label": "성장",
            "image": "",
            "size": 900
          },
          {
            "label": "표정 차분",
            "image": ""
          }
        ],
        "script": "YOUR MOM",
        "desc": "몰라 시발아",
        "stamp": {
          "title": "LILEY",
          "text": "thank you\nfor visiting"
        },
        "date": {
          "big": "12",
          "sub": "DECEMBER",
          "small": "2018.12.04"
        },
        "tabs": [
          {
            "name": "타임라인",
            "timelines": [
              {
                "name": "본편",
                "events": [
                  {
                    "date": "????",
                    "title": "첫 만남",
                    "text": "둘은 처음 고아원에서 만났습니다.",
                    "size": 3
                  },
                  {
                    "date": "???",
                    "title": "시작점",
                    "text": "스마일리가 연약했던 라이칸에게 마력의 반절을 나눠주며, 라이칸이 불멸체가 된 역사적 순간입니다.",
                    "size": 1
                  },
                  {
                    "date": "????.12",
                    "title": "이별",
                    "text": "스마일리가 동생과 고아원을 떠나게 되며, 둘은 기약없는 이별을 맞이합니다.",
                    "size": 2
                  },
                  {
                    "date": "2018.12",
                    "title": "재회",
                    "text": "불꽃놀이가 빛을 내던 겨울 밤, 사람을 먹고 있던 라이칸과 집으로 돌아가던 스마일리가 재회하게 됩니다.",
                    "size": 3
                  },
                  {
                    "date": "2019",
                    "title": "공식적인 선언",
                    "text": "라이칸과 공식적인 자리에서도 함께 다니기 위하여, '차기 마탑주'라는 공식적인 발표를 했습니다.",
                    "size": 1
                  }
                ],
                "desc": "ORIGINAL TIMELINE"
              },
              {
                "name": "AU · 학원",
                "desc": "학원 AU 에서의 타임라인",
                "events": [
                  {
                    "date": "1학년 봄",
                    "title": "입학식",
                    "text": "설명이 들어갑니다.",
                    "size": 2
                  },
                  {
                    "date": "1학년 여름",
                    "title": "사건 이름",
                    "text": "설명이 들어갑니다.",
                    "size": 1
                  },
                  {
                    "date": "2학년 겨울",
                    "title": "사건 이름",
                    "text": "설명이 들어갑니다.",
                    "size": 3
                  },
                  {
                    "date": "졸업",
                    "title": "졸업식",
                    "text": "설명이 들어갑니다.",
                    "size": 2
                  }
                ]
              }
            ]
          },
          {
            "name": "로그",
            "logs": [
              {
                "title": "시나리오 이름",
                "date": "2026.10.01",
                "system": "CoC 7th",
                "gm": "KP 이름",
                "players": "캐릭터 이름 (PL1), 캐릭터 이름 2 (PL2)",
                "desc": "세션 한 줄 소개가 들어갑니다.",
                "link": "",
                "speakers": {
                  "캐릭터 이름": {
                    "image": ""
                  },
                  "캐릭터 이름 2": {
                    "image": "",
                    "side": "right"
                  }
                },
                "raw": "\n# 1장. 시작\n비가 내리는 오후, 두 사람은 낡은 저택 앞에 서 있다.\n캐릭터 이름: 여기가 맞아?\n캐릭터 이름 2: 주소는 확실해.\n캐릭터 이름 2: 들어가 보자.\n> 캐릭터 이름 듣기 판정 (1D100<=50) → 32 성공\nKP: 안쪽에서 희미한 발소리가 들립니다.\n# 2장. 저택 안\n캐릭터 이름: ……누구 있어요?\n"
              },
              {
                "title": "다른 세션 이름",
                "date": "2026.10.05",
                "system": "인세인",
                "gm": "GM 이름",
                "players": "캐릭터 이름, 캐릭터 이름 2",
                "raw": "\n캐릭터 이름: 로그 내용을 여기에 붙여 넣어요.\n"
              }
            ]
          },
          {
            "name": "갤러리",
            "sections": [
              {
                "title": "",
                "en": "",
                "columns": 3,
                "images": [
                  {
                    "image": "",
                    "caption": "그림 설명"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "pair2",
        "name": "페어 이름 2",
        "en": "Pair Name 2",
        "thumb": "",
        "relation": "소꿉친구",
        "members": [
          "smiley",
          {
            "name": "다른 오너 캐릭터",
            "en": "OTHER CHARACTER",
            "thumb": "",
            "link": ""
          }
        ],
        "portraits": [
          "",
          ""
        ],
        "standing": "",
        "script": "",
        "desc": "",
        "stamp": {
          "title": "",
          "text": ""
        },
        "date": {
          "big": "",
          "sub": "",
          "small": ""
        },
        "tabs": [
          {
            "name": "타임라인",
            "timelines": [
              {
                "name": "본편",
                "events": [
                  {
                    "date": "어린 시절",
                    "title": "첫 만남",
                    "text": "설명이 들어갑니다.",
                    "size": 3
                  },
                  {
                    "date": "현재",
                    "title": "사건 이름",
                    "text": "설명이 들어갑니다.",
                    "size": 2
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "owner": {
    "title": "Owner",
    "subtitle": "About the owner",
    "profile": {
      "image": "",
      "shape": "circle",
      "name": "오너 닉네임",
      "en": "OWNER",
      "intro": "간단한 자기소개가 들어갑니다.\n줄바꿈은 이렇게.",
      "links": [
        {
          "name": "X (Twitter)",
          "url": "https://x.com/"
        },
        {
          "name": "Postype",
          "url": "https://www.postype.com/"
        }
      ]
    },
    "tabs": [
      {
        "name": "About",
        "sections": [
          {
            "title": "오너 정보",
            "en": "PROFILE",
            "rows": [
              [
                "활동명",
                "오너 닉네임"
              ],
              [
                "성인 여부",
                "성인"
              ],
              [
                "주 활동",
                "그림, 글"
              ],
              [
                "연락",
                "DM 편하게 주세요"
              ]
            ]
          },
          {
            "title": "좋아하는 것",
            "en": "LIKE",
            "text": "좋아하는 것들이 들어갑니다."
          },
          {
            "title": "주의사항",
            "en": "NOTICE",
            "text": "지뢰, 부탁드리는 점 등이 들어갑니다."
          }
        ]
      }
    ],
    "banner": {
      "columns": 2,
      "groups": [
        {
          "name": "Friends",
          "items": [
            {
              "name": "친구 홈페이지 1",
              "image": "",
              "link": ""
            },
            {
              "name": "친구 홈페이지 2",
              "image": "",
              "link": ""
            }
          ]
        },
        {
          "name": "Site",
          "items": [
            {
              "name": "사이트 이름",
              "image": "",
              "link": ""
            }
          ]
        }
      ]
    }
  },
  "guest": {
    "title": "Guest",
    "subtitle": "Guestbook",
    "intro": "방문해 주셔서 감사합니다!\n편하게 한마디 남겨 주세요.",
    "boardTitle": "Guestbook",
    "ownerName": "Owner",
    "mode": "firebase",
    "namePlaceholder": "이름",
    "messagePlaceholder": "방명록을 남겨 주세요!",
    "sendText": "남기기",
    "emptyText": "첫 번째 방명록을 남겨 주세요!",
    "firebase": {
      "config": {
        "apiKey": "",
        "authDomain": "",
        "projectId": "",
        "storageBucket": "",
        "messagingSenderId": "",
        "appId": ""
      },
      "ownerUid": "",
      "collection": "guestbook",
      "secret": true,
      "perPage": 10,
      "maxLength": 1000,
      "newestFirst": true
    },
    "widget": {
      "iframe": "",
      "height": 640,
      "code": ""
    },
    "links": [
      {
        "name": "에스크",
        "desc": "익명 질문 남기기",
        "url": ""
      },
      {
        "name": "메일함",
        "desc": "편지 보내기",
        "url": ""
      }
    ]
  }
};
