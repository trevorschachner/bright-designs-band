   CREATE TABLE shows (
       id SERIAL PRIMARY KEY,
       show_name VARCHAR(255) NOT NULL,
       band_size ENUM('Small', 'Medium', 'Large') NOT NULL,
       difficulty ENUM('Grade 1-2', 'Grade 3-4', 'Grade 5-6') NOT NULL,
       length TIME NOT NULL,
       date DATE NOT NULL
   );