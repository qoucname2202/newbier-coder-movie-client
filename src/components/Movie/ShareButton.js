const ShareButton = ({ movie }) => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(movie.url)}`;
    
    return (
        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            Chia sẻ trên Facebook
        </a>
    );
};
