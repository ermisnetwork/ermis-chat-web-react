import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ThemeProvider from './theme';
import Router from './routes';
import { closeSnackBar } from './redux/slices/app';
import AutoUpdate from './components/AutoUpdate';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import './assets/css/libs/slick.min.css';
import './assets/css/libs/slick-theme.min.css';
import './assets/css/index.css';

const vertical = 'bottom';
const horizontal = 'center';

const Alert = React.forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

function App() {
  const dispatch = useDispatch();

  const { severity, message, open } = useSelector(state => state.app.snackbar);

  return (
    <>
      <AutoUpdate />
      <ThemeProvider>
        {/* <ThemeSettings> */} <Router /> {/* </ThemeSettings> */}
      </ThemeProvider>

      {message && open ? (
        <Snackbar
          anchorOrigin={{ vertical, horizontal }}
          open={open}
          autoHideDuration={4000}
          key={vertical + horizontal}
          onClose={() => {
            console.log('This is clicked');
            dispatch(closeSnackBar());
          }}
        >
          <Alert
            onClose={() => {
              console.log('This is clicked');
              dispatch(closeSnackBar());
            }}
            severity={severity}
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        </Snackbar>
      ) : (
        <></>
      )}
    </>
  );
}

export default App;
