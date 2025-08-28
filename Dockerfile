# Use a modern Node.js version
FROM node:18-alpine
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
# COPY server.js ./
COPY . .

# Set environment variable for the CTF challenge
ENV hiddenDir="3o6iXUqvenBvW3wHqBBPVdDXzUxV3CBA3jK47cFEJZcrpNSzD6jeW943TGank8CBgx"

EXPOSE 3000

CMD [ "node", "server.js" ]
