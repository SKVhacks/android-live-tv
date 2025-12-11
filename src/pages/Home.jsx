import react,{useState , useEffect , useRef} from 'react';
import ChannelList from './ChannelList';
import links from '../data/links.json'
import next from '../sound/change.m4a'
import okie1 from '../sound/okie.m4a'
import { useNavigate } from "react-router-dom";

export default function Home(){
  const cardRefs = useRef([]);
  const moveSoundRef = useRef(null);
  const okSoundRef = useRef(null);
  
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

  async function resolveThumbnail(urls) {
    for (const url of urls) {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) return url; 
    }
    return null; // nothing available
  }

  const thumbnail = await resolveThumbnail([
      thumbnails.maxres,
      thumbnails.high,
      thumbnails.medium
  ]);

  return {
    title: data.title,
    channel: data.author_name,
    thumbnail:thumbnail,
    embedHtml: data.html
  };
  }

  const navigate = useNavigate();
  const[index,setIndex]=useState(0);
  
  useEffect(()=>{
    moveSoundRef.current = new Audio(next);
    okSoundRef.current = new Audio(okie1);
    moveSoundRef.current.preload = "auto";
    okSoundRef.current.preload = "auto";
    const keydetect = (e) =>{
    const key = e.key || e.detail;
    if (e.key==="Enter"){
      playOkSound();
    }
    setIndex(old=>{
      let i=old;
      if (e.key === "ArrowRight" && i< links.length-1){
        playMoveSound();
        i++;
      }
      if (e.key==="ArrowLeft" &&  i > 0){
        playMoveSound();
        i--;
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



useEffect(() => {
  getYouTubeDetails(`${links[index].url}` , `${links[index].id}`)
  .then(info => {
    setYtInfo({
      title: info.title,
      channel: info.channel,
      thumbnail:info.thumbnail
    });
  });

  // logic center the card
  if (cardRefs.current[index]) {
    cardRefs.current[index].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
  const keydetect = (e) =>{
    if (e.key==="Enter"){
      navigate(`/video/${links[index].id}`);
    }
  };
  window.addEventListener("keydown",keydetect);  
}, [index]);


return(
        <div className='relative h-screen w-screen bg-black text-white'>
            <img src={ytInfo.thumbnail} alt=""className='absolute h-screen w-screen'  />
            <div className={`absolute inset-0 bg-gradient-to-r from-neutral-950 via-black/60 to-transparent }`}></div>
            <div className='absolute top-10 left-10'>
                <p className=' text-white text-xs'>{links[index].category}</p>
                <p className='text-white text-7xl font-bold mt-1'>{ytInfo.channel}</p>
                <p className='text-white text-base mt-2 font-normal'>{ytInfo.title}</p>
            </div>
            {/* card container */}
            <div className='absolute bottom-3  inset-x-0 '>
               <div className="relative w-full py-3 ">
                <div className="flex gap-5 overflow-x-auto scroll-smooth  px-10 py-8 items-center [scrollbar-width:none] [-ms-overflow-style:none]">
                {/* cards */}
                {links.map((item, i )=>
                  <div key={i} ref={(el) => (cardRefs.current[i] = el)}>
                    <ChannelList  item={item} focuse={i===index}/> 
                  </div>
                )}
                </div>
                </div>
            </div>
        </div>
    );
}