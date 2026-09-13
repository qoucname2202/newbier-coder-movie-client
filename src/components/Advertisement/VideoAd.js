import AdPlayer from './AdPlayer';

const VideoAd = ({ onComplete = () => {}, allowSkip = true, skipDelay = 5 }) => {
  
  return (
    <AdPlayer 
      onAdComplete={onComplete}
      allowSkip={allowSkip}
      skipDelay={skipDelay}
    />
  );
};

export default VideoAd;
