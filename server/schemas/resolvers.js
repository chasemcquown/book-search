const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks')

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('savedBooks')
    }
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { user, body }) => {
      
      try {
        const updateUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: body } },
          { new: true, runvalidators: true }
        )
        return updateUser;
      } catch (err) {
        return err;
      }
    },
    removeBook: async (parent, { user, params }) => {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id }, 
          { $pull: { savedBooks: { bookId: params.bookId} } },
          { new: true } 
        )
        if (!updatedUser) {
          return res.status(404).json({ message: "Couldn't find user with this id!" })
        }
        return updatedUser;
    }
    
  }
};

module.exports = resolvers;