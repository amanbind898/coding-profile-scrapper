const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

const getCodeChefProfile = async (username) => {
    const url = `https://www.codechef.com/users/${username}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract badges information
    const badgesArray = [];
    $('.widget.badges .badge').each((i, badge) => {
        const imageElement = $(badge).find('.badge__image img');
        const titleElement = $(badge).find('.badge__title');
        const descriptionElement = $(badge).find('.badge__description');

        const badgeData = {
            image: imageElement.attr('src'),
            title: titleElement.text(),
            description: descriptionElement.text().trim()
        };

        badgesArray.push(badgeData);
    });

    // Extract other profile information
    const profileData = {
        profilePicture: $('.profileImage').attr('src'),
        username: $('h1.h2-style').text().trim(),
        rating: $('.rating').first().text().trim(),
        highestRating: $('.rating-number').last().text().trim(),
        badges: badgesArray,
        problemsSolved: $('.problems-solved').next().text().trim(),
        country: $('.user-country-name').text().trim(),
        studentOrProfessional: $('li:contains("Student/Professional:") span').text().trim(),
        institution: $('li:contains("Institution:") span').text().trim(),
        contestsParticipated: $('.contest-participated-count b').text().trim(),
        ratingGraph: $('#cumulative-graph').html(),
    };

    return profileData;
};

const getLeetCodeProfile = async (username) => {
    const url = `https://alfa-leetcode-api.onrender.com/${username}`;
    const response = await axios.get(url);
    return response.data;
};

const getCodeforcesProfile = async (username) => {
    const url = `https://codeforces.com/api/user.info?handles=${username}`;
    const response = await axios.get(url);
    const userData = response.data.result[0];

    const profileData = {
        username: userData.handle,
        rating: userData.rating,
        maxRating: userData.maxRating,
        rank: userData.rank,
        maxRank: userData.maxRank,
        country: userData.country || 'N/A',
        organization: userData.organization || 'N/A',
        avatar: userData.avatar,
        contribution: userData.contribution,
    };

    return profileData;
};

// Route to fetch CodeChef profile
app.get('/profile/codechef/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const profileData = await getCodeChefProfile(username);
        res.json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching CodeChef profile');
    }
});

// Route to fetch LeetCode profile
app.get('/profile/leetcode/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const profileData = await getLeetCodeProfile(username);
        res.json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching LeetCode profile');
    }
});

// Route to fetch Codeforces profile
app.get('/profile/codeforces/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const profileData = await getCodeforcesProfile(username);
        res.json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching Codeforces profile');
    }
});

// Aggregated route to fetch profiles from all platforms
app.get('/profile/:codechef/:leetcode/:codeforces', async (req, res) => {
    const { codechef, leetcode, codeforces } = req.params;

    try {
        const [codeChefProfile, leetCodeProfile, codeforcesProfile] = await Promise.all([
            getCodeChefProfile(codechef),
            getLeetCodeProfile(leetcode),
            getCodeforcesProfile(codeforces)
        ]);

        const profileData = {
            codechef: codeChefProfile,
            leetcode: leetCodeProfile,
            codeforces: codeforcesProfile,
        };

        res.json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the CodeChef, LeetCode, and Codeforces profile API',
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
