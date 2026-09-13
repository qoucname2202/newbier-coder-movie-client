import StarRatings from 'react-star-ratings';

const Rating = ({ rating, onRatingChange }) => {
    return (
        <StarRatings
            rating={rating}
            starRatedColor="gold"
            changeRating={onRatingChange}
            numberOfStars={5}
            name='rating'
        />
    );
};

export default Rating;
