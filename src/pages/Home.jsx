import react,{useState , useEffect , useRef} from 'react';
import ChannelList from './ChannelList';
import links from '../data/links.json'
import next from '../sound/change.m4a'
import okie1 from '../sound/okie.m4a'
import { useNavigate } from "react-router-dom";
import useBackExit from './useBackExit';
export default function Home(){

const [ytInfo, setYtInfo] = useState({
  title: "",
  channel: "",
  thumbnail:""
});


async function getYouTubeDetails(videoUrl,url) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const response = await fetch(oembedUrl);
  const data = await response.json();



   const thumbnails = {
    maxres: `https://img.youtube.com/vi/${url}/maxresdefault.jpg`,
    high: `https://img.youtube.com/vi/${url}/hqdefault.jpg`,
    medium: `https://img.youtube.com/vi/${url}/mqdefault.jpg`,
  };

  return {
    title: data.title,
    channel: data.author_name,
    channelUrl: data.author_url,
    thumbnail: thumbnails.maxres,
    embedHtml: data.html
  };
}







const navigate = useNavigate();
const[index,setIndex]=useState(0);
useEffect(()=>{
  const keydetect = (e) =>{
     const key = e.key || e.detail;

    if (e.key==="Enter"){
      playOkSound();
      // console.log(links[index].id);
      // navigate(`/video/${links[index].id}`);
    }
    
    setIndex(old=>{
      let i=old;
      if (e.key === "ArrowRight" && i< links.length-1){
         playMoveSound();
        i++;
        
      }
      if (e.key==="ArrowLeft" &&  i > 0){
         playMoveSound();
        i= i-1;
      }
      return i;
    });
  };
  window.addEventListener("keydown",keydetect);
  window.addEventListener("dpad", keydetect);
 
   return () => {
      window.removeEventListener("keydown", keydetect);
      window.addEventListener("dpad", keydetect);
    }; 
},[]);






const cardRefs = useRef([]);
const moveSoundRef = useRef(null);
const okSoundRef = useRef(null);
useEffect(() => {

  getYouTubeDetails(`${links[index].url}` , `${links[index].id}`)
  .then(info => {
    setYtInfo({
      title: info.title,
      channel: info.channel,
      thumbnail:info.thumbnail
    });
  });


  // logic up
  if (cardRefs.current[index]) {
    cardRefs.current[index].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
  const keydetect = (e) =>{
    if (e.key==="Enter"){
      // playOkSound();
      console.log(links[index].id);
      navigate(`/video/${links[index].id}`);
    }
  };
  window.addEventListener("keydown",keydetect);

  
}, [index]);

useEffect(() => {
  moveSoundRef.current = new Audio(next);
  okSoundRef.current = new Audio(okie1);

  moveSoundRef.current.preload = "auto";
  okSoundRef.current.preload = "auto";
}, []);

const playMoveSound = () => {
  const audio = moveSoundRef.current;
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.play();
};

const playOkSound = () => {
  const audio = okSoundRef.current;
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.play();
};

return(
        <div className='relative h-screen w-screen bg-black text-white'>
            <img src={ytInfo.thumbnail} alt=""className='absolute h-screen w-screen'  />
            <div className={`absolute inset-0 bg-gradient-to-r from-gray-900 via-black/40 to-transparent }`}></div>
            <div className='absolute top-25 left-15'>
                <p className=' text-white text-1xl'>{links[index].category}</p>
                <p className='text-white text-8xl font-bold mt-1'>{ytInfo.channel}</p>
                <p className='text-white text-1.5xl mt-3 font-normal'>{ytInfo.title}</p>
            </div>
            

           <div className='absolute bottom-5   inset-x-0 '>
               <div className="relative w-full   py-3 ">
      <div
        className="
          flex gap-6 overflow-x-auto scroll-smooth  px-10 py-8
        items-center 
          [scrollbar-width:none] 
          [-ms-overflow-style:none]
        "
      >
        {/* Hide scrollbar for WebKit
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style> */}

      
            {links.map((item, i )=>
              <div
    key={i}
    ref={(el) => (cardRefs.current[i] = el)}
  > <ChannelList  item={item} focuse={i===index}/> 
  
  </div>
  )}
        
      </div>
    </div>

           </div>


        </div>
    )
}