use std::cmp;

pub fn calculate_number_of_tiles(max_tiles_from_center: u64) -> u64 {
    if max_tiles_from_center == 0 {
        return 1;
    }

    let max_length = (max_tiles_from_center * 2) + 1;

    let bottom_width = max_length - max_tiles_from_center;

    let mut sum = max_length;
    let mut current_row_length = max_length - 1;
    loop {
        sum += current_row_length * 2;
        current_row_length -= 1;

        if current_row_length < bottom_width {
            break;
        }
    }

    sum
}

pub fn calculate_next_coordinates(max_tiles_from_center: u8, q: i16, r: i16) -> (i16, i16) {
    // calculate the r_max for the given q
    let r_max = cmp::min(max_tiles_from_center as i16, -q + (max_tiles_from_center as i16));

    if r == r_max {
        // increment q by one and calculate r_min
        let new_q = q + 1;
        let r_min = cmp::max(-(max_tiles_from_center as i16), -new_q - (max_tiles_from_center as i16));
        return (new_q, r_min);
    }

    return (q, r + 1);
}