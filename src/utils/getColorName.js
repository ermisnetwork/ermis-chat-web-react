// ----------------------------------------------------------------------

export default function getColorName(name) {
  let firstLetter = '';
  if (name) {
    if (name.length >= 25) {
      firstLetter = name.charAt(name.length - 1).toUpperCase();
    } else {
      firstLetter = name.charAt(0).toUpperCase();
    }
  } else {
    firstLetter = '';
  }
  // const firstLetter = name ? name.charAt(0).toUpperCase() : '';
  let color;

  switch (firstLetter) {
    case 'A':
      color = 'linear-gradient(#FF5733, #C70039)';
      break;
    case 'B':
      color = 'linear-gradient(#85C1E9, #21618C)';
      break;
    case 'C':
      color = 'linear-gradient(#DAF7A6, #FFC300)';
      break;
    case 'D':
      color = 'linear-gradient(#FFC0CB, #FF1493)';
      break;
    case 'E':
      color = 'linear-gradient(#8E44AD, #2980B9)';
      break;
    case 'F':
      color = 'linear-gradient(#F39C12, #D35400)';
      break;
    case 'G':
      color = 'linear-gradient(#AED6F1, #2E86C1)';
      break;
    case 'H':
      color = 'linear-gradient(#58D68D, #28B463)';
      break;
    case 'I':
      color = 'linear-gradient(#F4D03F, #F39C12)';
      break;
    case 'J':
      color = 'linear-gradient(#EB984E, #CB4335)';
      break;
    case 'K':
      color = 'linear-gradient(#A569BD, #8E44AD)';
      break;
    case 'L':
      color = 'linear-gradient(#F5B041, #DC7633)';
      break;
    case 'M':
      color = 'linear-gradient(#76D7C4, #48C9B0)';
      break;
    case 'N':
      color = 'linear-gradient(#85929E, #34495E)';
      break;
    case 'O':
      color = 'linear-gradient(#FF5733, #900C3F)';
      break;
    case 'P':
      color = 'linear-gradient(#5DADE2, #2E86C1)';
      break;
    case 'Q':
      color = 'linear-gradient(#ABEBC6, #239B56)';
      break;
    case 'R':
      color = 'linear-gradient(#FAD7A0, #E59866)';
      break;
    case 'S':
      color = 'linear-gradient(#D7DBDD, #566573)';
      break;
    case 'T':
      color = 'linear-gradient(#B2BABB, #626567)';
      break;
    case 'U':
      color = 'linear-gradient(#D2B4DE, #8E44AD)';
      break;
    case 'V':
      color = 'linear-gradient(#C39BD3, #7D3C98)';
      break;
    case 'W':
      color = 'linear-gradient(#BB8FCE, #8E44AD)';
      break;
    case 'X':
      color = 'linear-gradient(#F7DC6F, #F1C40F)';
      break;
    case 'Y':
      color = 'linear-gradient(#52BE80, #27AE60)';
      break;
    case 'Z':
      color = 'linear-gradient(#1ABC9C, #16A085)';
      break;
    case '0':
      color = 'linear-gradient(#00FF00, #006600)';
      break;
    case '1':
      color = 'linear-gradient(#FFFF00, #FFD700)';
      break;
    case '2':
      color = 'linear-gradient(#FF0000, #8B0000)';
      break;
    case '3':
      color = 'linear-gradient(#E6E6FA, #D8BFD8)';
      break;
    case '4':
      color = 'linear-gradient(#0000FF, #00008B)';
      break;
    case '5':
      color = 'linear-gradient(#800080, #4B0082)';
      break;
    case '6':
      color = 'linear-gradient(#BADA55, #8CBF3F)';
      break;
    case '7':
      color = 'linear-gradient(#8B4513, #A0522D)';
      break;
    case '8':
      color = 'linear-gradient(#1E90FF, #4169E1)';
      break;
    case '9':
      color = 'linear-gradient(#996633, #663300)';
      break;
    default:
      color = 'linear-gradient(#B694F9, #6C61DF)';
  }

  return color;
}
