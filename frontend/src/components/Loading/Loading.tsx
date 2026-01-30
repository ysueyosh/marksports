import { Backdrop, CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <Backdrop
      open
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
