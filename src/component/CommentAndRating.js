import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Theme variables integrated directly into the file
const SPACING = {
  space_2: 2,
  space_4: 4,
  space_8: 8,
  space_10: 10,
  space_12: 12,
  space_15: 15,
  space_16: 16,
  space_18: 18,
  space_20: 20,
  space_24: 24,
  space_28: 28,
  space_30: 30,
  space_32: 32,
  space_36: 36,
};

const COLORS = {
  primaryRedHex: '#DC3535',
  primaryOrangeHex: '#D17842',
  primaryBlackHex: '#0C0F14',
  primaryDarkGreyHex: '#343d4d',
  secondaryDarkGreyHex: '#21262E',
  primaryGreyHex: '#252A32',
  secondaryGreyHex: '#252A32',
  primaryLightGreyHex: '#ffffff',
  primaryLightGreyHex2: '#000000',
  secondaryLightGreyHex: '#AEAEAE',
  primaryWhiteHex: '#577282',
  primaryWhiteHex2: '#ffffff',
  primaryBlackRGBA: 'rgba(12,15,20,0.5)',
  secondaryBlackRGBA: 'rgba(0,0,0,0.7)',
};

const FONTFAMILY = {
  poppins_black: 'Poppins-Black',
  poppins_bold: 'Poppins-Bold',
  poppins_extrabold: 'Poppins-ExtraBold',
  poppins_extralight: 'Poppins-ExtraLight',
  poppins_light: 'Poppins-Light',
  poppins_light_italic: 'Poppins-LightItalic',
  poppins_medium: 'Poppins-Medium',
  poppins_regular: 'Poppins-Regular',
  poppins_semibold: 'Poppins-SemiBold',
  poppins_thin: 'Poppins-Thin',
};

const FONTSIZE = {
  size_8: 8,
  size_10: 10,
  size_12: 12,
  size_14: 14,
  size_16: 16,
  size_18: 18,
  size_20: 20,
  size_24: 24,
  size_28: 28,
  size_30: 30,
};

const BORDERRADIUS = {
  radius_4: 4,
  radius_8: 8,
  radius_10: 10,
  radius_15: 15,
  radius_20: 20,
  radius_25: 25,
};

const CommentAndRating = ({ 
  id, 
  targetCollection, 
  comments = [],
  setComments,
  onUserCommentDeleted,
  isDarkMode = false,
  requirePurchase = true,
}) => {
  const [pendingRating, setPendingRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [userHasCommented, setUserHasCommented] = useState(false);
  const [userComment, setUserComment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEventCompleted, setIsEventCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  // Add new state for current user info
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  // Add useEffect to fetch current user info
  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      try {
        const userDoc = await firestore()
          .collection('USER')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          setCurrentUserInfo({
            username: userDoc.data()?.name || 'Anonymous',
            profilePic: userDoc.data()?.photoURL || null,
          });
        }
      } catch (error) {
        console.error('Error fetching current user info:', error);
      }
    };

    fetchCurrentUserInfo();
  }, []);

  useEffect(() => {
    // Check if event is completed
    const checkEventCompletion = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      try {
        const eventDoc = await firestore()
          .collection('USER')
          .doc(currentUser.uid)
          .collection('registeredEvents')
          .doc(id)
          .get();

        setIsEventCompleted(eventDoc.exists && eventDoc.data()?.completed === true);
      } catch (error) {
        console.error('Error checking event completion:', error);
      }
    };

    checkEventCompletion();
  }, [id]);

  // Modify the useEffect that checks completion status
  useEffect(() => {
    const fetchUserComment = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser || !id) return;

      try {
        // Check if user has already commented
        const commentQuery = await firestore()
          .collection(targetCollection)
          .doc(id)
          .collection('CommentsAndRatings')
          .where('userId', '==', currentUser.uid)
          .get();

        if (!commentQuery.empty) {
          const commentData = commentQuery.docs[0].data();
          setUserHasCommented(true);
          setUserComment(commentData);
          setPendingRating(commentData.rating);
        }
      } catch (error) {
        console.error('Error fetching user comment:', error);
      }
    };

    fetchUserComment();
  }, [id, targetCollection]);

  const renderRatingStars = () => {
    const stars = [1, 2, 3, 4, 5];
    return stars.map(star => (
      <TouchableOpacity key={star} onPress={() => setPendingRating(star)}>
        <Ionicons
          name={star <= pendingRating ? 'star' : 'star-outline'}
          size={24}
          color={COLORS.primaryOrangeHex}
        />
      </TouchableOpacity>
    ));
  };

  const handleAddCommentAndRating = async () => {
    if ((commentText.trim() || pendingRating > 0)) {
      setLoading(true);
      try {
        const userId = auth().currentUser?.uid;
        const userEmail = auth().currentUser?.email;
    
        if (!userId) {
          Alert.alert('Error', 'You must be logged in to comment');
          return;
        }

        // Check if user has purchased item if requirePurchase is true
        if (requirePurchase) {
          const registeredEventsRef = firestore()
            .collection('USER')
            .doc(userId)
            .collection('registeredEvents')
            .where('eventId', '==', id)
            .where('completed', '==', true);

          const registeredEventsSnapshot = await registeredEventsRef.get();
          
          if (registeredEventsSnapshot.empty) {
            Alert.alert('Restricted', 'You can only comment on events you have completed.');
            setLoading(false);
            return;
          }
        }

        // Fetch additional user data (username, profilePic) from Firestore
        const userDoc = await firestore().collection('USER').doc(userId).get();
        const userName = userDoc.exists ? userDoc.data()?.name || "Anonymous" : "Anonymous";
        const profilePicture = userDoc.exists ? userDoc.data()?.photoURL || null : null;
  
        if (!targetCollection) {
          console.error("Target collection not specified");
          setLoading(false);
          return;
        }

        const docRef = firestore().collection(targetCollection).doc(id);
        const docSnapshot = await docRef.get();
    
        if (docSnapshot.exists) {
          // Fetch all comments and ratings for this item
          const commentsSnapshot = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .get();
    
          const allComments = commentsSnapshot.docs.map(doc => doc.data());
          
          // Find the user's existing comment/rating
          const userExistingComment = allComments.find(comment => comment.userId === userId);
    
          // Prepare the list of ratings, excluding the current user's previous rating
          const otherRatings = allComments.filter(comment => 
            comment.userId !== userId && comment.rating > 0
          );
    
          // Calculate new average rating
          const newRatings = [...otherRatings, { rating: pendingRating }];
          const updatedAverageRating = newRatings.length > 0 
            ? newRatings.reduce((sum, comment) => sum + comment.rating, 0) / newRatings.length
            : 0;
    
          // Prepare update object
          const updateData = {
            average_rating: updatedAverageRating,
            ratings_count: newRatings.length
          };
    
          // Update the document
          await docRef.update(updateData);
    
          // Handle comment in CommentsAndRatings sub-collection
          const commentQuery = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .where('userId', '==', userId)
            .get();
    
          if (!commentQuery.empty) {
            // Update existing comment
            const commentDoc = commentQuery.docs[0];
            await commentDoc.ref.update({
              comment: commentText,
              rating: pendingRating,
              timestamp: firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Add new comment
            await firestore()
              .collection(targetCollection)
              .doc(id)
              .collection('CommentsAndRatings')
              .add({
                comment: commentText,
                rating: pendingRating,
                timestamp: firestore.FieldValue.serverTimestamp(),
                userId: userId,
                email: userEmail,
                username: userName,
                profilePic: profilePicture,
              });
          }
    
          // Fetch and sort updated comments
          const updatedCommentsSnapshot = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .get();
    
          const allCommentsAndRatings = updatedCommentsSnapshot.docs.map(doc => ({
            ...doc.data(),
            commentId: doc.id
          }));
    
          const sortedComments = allCommentsAndRatings.sort((a, b) => {
            const currentUserId = auth().currentUser?.uid;
            if (a.userId === currentUserId) return -1;
            if (b.userId === currentUserId) return 1;
            return 0;
          });
    
          // Update local state
          if (setComments) {
            setComments(sortedComments);
          }
          setUserHasCommented(true);
          setUserComment({
            comment: commentText,
            rating: pendingRating,
            userId: userId,
            email: userEmail,
            username: userName,
            profilePic: profilePicture,
          });
    
          // Clear input fields after adding new comment
          setCommentText('');
        }
      } catch (error) {
        console.error('Error adding/editing comment and rating:', error);
        Alert.alert('Error', 'Failed to submit your comment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteComment = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.error("User is not logged in");
        return;
      }

      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete your comment?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const docRef = firestore().collection(targetCollection).doc(id);
          
                // Fetch all comments
                const commentsSnapshot = await firestore()
                  .collection(targetCollection)
                  .doc(id)
                  .collection('CommentsAndRatings')
                  .get();
          
                const allComments = commentsSnapshot.docs.map(doc => ({
                  ...doc.data(),
                  commentId: doc.id
                }));
          
                // Remove the user's comment
                const updatedComments = allComments.filter(comment => comment.userId !== userId);
          
                // Recalculate ratings
                const validRatings = updatedComments.filter(comment => comment.rating > 0);
                const updatedAverageRating = validRatings.length > 0 
                  ? validRatings.reduce((sum, comment) => sum + comment.rating, 0) / validRatings.length
                  : 0;
          
                // Update the main document
                await docRef.update({
                  average_rating: updatedAverageRating,
                  ratings_count: validRatings.length
                });
          
                // Delete the user's comment document
                const userCommentQuery = await firestore()
                  .collection(targetCollection)
                  .doc(id)
                  .collection('CommentsAndRatings')
                  .where('userId', '==', userId)
                  .get();
          
                if (!userCommentQuery.empty) {
                  await userCommentQuery.docs[0].ref.delete();
                }
          
                // Sort comments
                const sortedComments = updatedComments.sort((a, b) => {
                  const currentUserId = auth().currentUser?.uid;
                  if (a.userId === currentUserId) return -1;
                  if (b.userId === currentUserId) return 1;
                  return 0;
                });
          
                // Update local state
                if (setComments) {
                  setComments(sortedComments);
                }
                setUserHasCommented(false);
                setUserComment(null);
                setPendingRating(0);
          
                // Callback for parent component
                if (onUserCommentDeleted) {
                  onUserCommentDeleted();
                }
              } catch (error) {
                console.error('Error deleting comment:', error);
                Alert.alert('Error', 'Failed to delete your comment. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in delete comment flow:', error);
    }
  };

  const renderUserComment = () => {
    if (!userComment) return null;

    return (
      <View style={[
        styles.userCommentContainer,
        isDarkMode ? styles.darkModeContainer : styles.lightModeContainer
      ]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentProfile}>
            {currentUserInfo?.profilePic ? (
              <Image source={{ uri: currentUserInfo.profilePic }} style={styles.commentAvatar} />
            ) : (
              <View style={[
                styles.commentAvatarPlaceholder,
                isDarkMode ? styles.darkModeAvatar : styles.lightModeAvatar
              ]}>
                <Text style={[
                  styles.avatarInitial,
                  isDarkMode ? styles.darkModeText : styles.lightModeText
                ]}>
                  {currentUserInfo?.username?.[0]?.toUpperCase() || 'A'}
                </Text>
              </View>
            )}
            <View style={styles.commentUserInfo}>
              <Text style={[
                styles.commentUsername,
                isDarkMode ? styles.darkModeText : styles.lightModeText
              ]}>
                {currentUserInfo?.username || 'Anonymous'}
              </Text>
              <View style={styles.ratingStarsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= (isEditing ? pendingRating : userComment.rating) ? "star" : "star-outline"}
                    size={16}
                    color={COLORS.primaryOrangeHex}
                  />
                ))}
              </View>
            </View>
          </View>
          <View style={styles.commentActions}>
            {!isEditing && (
              <>
                <TouchableOpacity 
                  onPress={() => {
                    setIsEditing(true);
                    setEditText(userComment.comment);
                  }} 
                  style={[styles.actionButton, styles.editButton]}
                >
                  <Ionicons name="pencil-outline" size={16} color={COLORS.primaryWhiteHex2} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDeleteComment}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.primaryWhiteHex2} />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[
                styles.commentInput,
                isDarkMode ? styles.darkModeInput : styles.lightModeInput
              ]}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your comment..."
              placeholderTextColor={isDarkMode ? COLORS.secondaryLightGreyHex : COLORS.primaryLightGreyHex}
            />
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditText('');
                  setPendingRating(userComment.rating);
                }}
              >
                <Text style={styles.editButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.saveButton]}
                onPress={() => handleAddCommentAndRating()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.primaryWhiteHex2} />
                ) : (
                  <Text style={styles.editButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[
            styles.commentText,
            isDarkMode ? styles.darkModeText : styles.lightModeText
          ]}>
            {userComment.comment}
          </Text>
        )}
      </View>
    );
  };

  const renderComment = (comment, index) => {
    // Skip rendering the user's own comment as it's handled separately
    if (comment.userId === auth().currentUser?.uid) return null;

    return (
      <View key={comment.commentId || index} style={styles.commentItem}>
        <View style={styles.commentProfile}>
          {comment.profilePic ? (
            <Image source={{ uri: comment.profilePic }} style={styles.commentAvatar} />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {comment.username && comment.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.commentUserInfo}>
            <Text style={[styles.commentUsername, isDarkMode && styles.darkText]}>
              {comment.username || 'Anonymous'}
            </Text>
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= comment.rating ? "star" : "star-outline"}
                  size={14}
                  color={COLORS.primaryOrangeHex}
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.commentText, isDarkMode && styles.darkText]}>
          {comment.comment}
        </Text>
        
        {comment.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(comment.timestamp.toDate()).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Comments and Ratings</Text>
      
      {!userHasCommented && (
        <>
          <Text style={[styles.ratingTitle, isDarkMode && styles.darkText]}>Rate this Item</Text>
          <View style={styles.ratingContainer}>{renderRatingStars()}</View>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={[styles.commentInput, isDarkMode && styles.darkModeInput]}
              placeholder="Add a comment..."
              placeholderTextColor={isDarkMode ? COLORS.primaryLightGreyHex : COLORS.primaryGreyHex}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity 
              onPress={handleAddCommentAndRating} 
              style={styles.commentButton}
              disabled={loading || (!commentText.trim() && pendingRating === 0)}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primaryBlackHex} />
              ) : (
                <Text style={styles.commentButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <View style={styles.commentsListContainer}>
        {userHasCommented && renderUserComment()}
        
        {comments.length > 0 ? (
          comments.map(renderComment)
        ) : (
          <Text style={[styles.noCommentsText, isDarkMode && styles.darkText]}>
            No comments yet. Be the first to comment!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_16,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex2,
    marginBottom: SPACING.space_10,
  },
  darkText: {
    color: COLORS.primaryWhiteHex2,
  },
  ratingTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex2,
    marginTop: SPACING.space_10,
    marginBottom: SPACING.space_8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.space_15,
  },
  commentInputContainer: {
    marginBottom: SPACING.space_20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    minHeight: 80,
    color: COLORS.primaryLightGreyHex2,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_12,
  },
  darkModeInput: {
    borderColor: COLORS.primaryGreyHex,
    backgroundColor: COLORS.primaryDarkGreyHex,
    color: COLORS.primaryWhiteHex2,
  },
  commentButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    alignItems: 'center',
    marginTop: SPACING.space_10,
  },
  commentButtonText: {
    color: COLORS.primaryBlackHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  commentsListContainer: {
    marginTop: SPACING.space_15,
  },
  userCommentContainer: {
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_16,
  },
  darkModeContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
  },
  lightModeContainer: {
    backgroundColor: COLORS.primaryWhiteHex,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_15, // Ensure border radius is applied
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  commentItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_15,
  },
  commentProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.space_12,
  },
  commentAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  avatarInitial: {
    color: COLORS.primaryWhiteHex2,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUsername: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginBottom: 2,
  },
  ratingStarsRow: {
    flexDirection: 'row',
  },
  commentText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginVertical: SPACING.space_10,
  },
  timestamp: {
    fontFamily: FONTFAMILY.poppins_light,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    alignSelf: 'flex-end',
  },
  noCommentsText: {
    fontFamily: FONTFAMILY.poppins_light_italic,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    marginVertical: SPACING.space_20,
  },
  editContainer: {
    marginTop: SPACING.space_10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.space_10,
    gap: SPACING.space_10,
  },
  editButton: {
    paddingHorizontal: SPACING.space_15,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  cancelButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  editButtonText: {
    color: COLORS.primaryWhiteHex2,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    minWidth: 80,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.primaryRedHex,
  },
  actionButtonText: {
    color: COLORS.primaryWhiteHex2,
    marginLeft: SPACING.space_4,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  editActionButton: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    minWidth: 80,
    alignItems: 'center',
  },
  darkModeAvatar: {
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  lightModeAvatar: {
    backgroundColor: COLORS.secondaryLightGreyHex,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8, // Add gap between buttons
  },
});

export default CommentAndRating;