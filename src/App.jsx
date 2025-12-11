import react, { useState , useEffect}from 'react';
import {BrowserRouter , Routes , Route} from 'react-router-dom';
import Home from './pages/Home'
import Video from './pages/Videoplayer'
import LoadingScreen from './pages/LoadingScreen';
export default function App(){
  
const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); 
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path='' element={<Home/>}  />
        <Route path='/video/:id' element={<Video/>}/>
      </Routes>
    </BrowserRouter>
  );
}