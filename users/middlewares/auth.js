async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Attach decoded user to the request object for later use
        req.user = user;

        // Allow Admins
        if (user.role === 'A') {
            return next();
        }

        // Allow regular users only to access their own resources
        if (user.role === 'U') {
            if (req.params.id && req.params.id == user.id) {
                return next();
            } else {
                return res.status(403).json({ message: 'Forbidden: Access denied' });
            }
        }

        // If no conditions matched, deny access
        return res.status(403).json({ message: 'Forbidden: Role not allowed' });
    });
}


//For personal use, allow users to access their own PRIVATE resources 
async function authenticateTokenPrivate(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Attach decoded user to the request object for later use
        req.user = user;

        // Allow regular users only to access their own resources
        if (user.role === 'U') {
            if (req.params.id && req.params.id == user.id) {
                return next();
            } else {
                return res.status(403).json({ message: 'Forbidden: Access denied' });
            }
        }

        // If no conditions matched, deny access
        return res.status(403).json({ message: 'Forbidden: Role not allowed' });
    });
}

async function authenticateTokenVolunteer(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }


        // Attach decoded user to the request object for later use
        req.user = user;

        // allow volunteers to access their own resources
        if (user.role === 'V') {
            next()
            return
        }

        // Allow regular users only to access their own resources
        if (user.role === 'U') {
            if (req.params.id && req.params.id == user.id) {
                return next();
            } else {
                return res.status(403).json({ message: 'Forbidden: Access denied' });
            }
        }

        // If no conditions matched, deny access
        return res.status(403).json({ message: 'Forbidden: Role not allowed' });
    });
}



module.exports = {
    authenticateToken,
    authenticateTokenPrivate,
    authenticateTokenVolunteer
    // Add other middleware exports here
};
