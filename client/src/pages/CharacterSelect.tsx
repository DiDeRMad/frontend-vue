import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCharactersQuery, useDeleteCharacterMutation } from '../services/api';
import { selectCharacter, setCharacters } from '../stores/slices/characterSlice';
import { RootState } from '../stores/store';
import LoadingScreen from '../components/ui/LoadingScreen';
import toast from 'react-hot-toast';
import './CharacterSelect.css';

const CharacterSelect: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { characters } = useSelector((state: RootState) => state.character);
  const { data, isLoading, error } = useGetCharactersQuery(undefined);
  const [deleteCharacter] = useDeleteCharacterMutation();
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (data) {
      dispatch(setCharacters(data));
    }
  }, [data, dispatch]);

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };

  const handleEnterWorld = () => {
    if (selectedCharacterId) {
      const character = characters.find(c => c.id === selectedCharacterId);
      if (character) {
        dispatch(selectCharacter(character));
        navigate('/game');
      }
    }
  };

  const handleCreateCharacter = () => {
    navigate('/character-create');
  };

  const handleDeleteCharacter = async () => {
    if (selectedCharacterId) {
      try {
        await deleteCharacter(selectedCharacterId).unwrap();
        toast.success('Character deleted successfully');
        setShowDeleteConfirm(false);
        setSelectedCharacterId(null);
      } catch (error) {
        toast.error('Failed to delete character');
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading characters..." />;
  }

  if (error) {
    return <div className="error-screen">Failed to load characters</div>;
  }

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  return (
    <div className="character-select">
      <div className="character-select-background">
        <div className="scene-3d">
          {/* 3D character preview would go here */}
        </div>
      </div>

      <div className="character-select-ui">
        <h1 className="page-title">Select Character</h1>

        <div className="character-list">
          {characters.length === 0 ? (
            <div className="no-characters">
              <p>You have no characters yet.</p>
              <button onClick={handleCreateCharacter} className="create-first-button">
                Create Your First Character
              </button>
            </div>
          ) : (
            <>
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`character-item ${selectedCharacterId === character.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="character-portrait">
                    <div className="portrait-placeholder" />
                  </div>
                  <div className="character-info">
                    <h3 className="character-name">{character.name}</h3>
                    <p className="character-details">
                      Level {character.level} {character.race} {character.class}
                    </p>
                    <p className="character-location">
                      {character.zone?.name || 'Unknown Location'}
                    </p>
                  </div>
                </div>
              ))}
              
              {characters.length < 5 && (
                <div className="character-item create-new" onClick={handleCreateCharacter}>
                  <div className="create-icon">+</div>
                  <p>Create New Character</p>
                </div>
              )}
            </>
          )}
        </div>

        {selectedCharacter && (
          <div className="character-details">
            <h2>{selectedCharacter.name}</h2>
            <div className="character-stats">
              <div className="stat-item">
                <span className="stat-label">Level</span>
                <span className="stat-value">{selectedCharacter.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Class</span>
                <span className="stat-value">{selectedCharacter.class}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Race</span>
                <span className="stat-value">{selectedCharacter.race}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Play Time</span>
                <span className="stat-value">
                  {Math.floor(Number(selectedCharacter.playTime) / 3600)}h
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={handleEnterWorld} className="enter-world-button">
                Enter World
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h3>Delete Character</h3>
            <p>Are you sure you want to delete {selectedCharacter?.name}?</p>
            <p className="warning">This action cannot be undone!</p>
            <div className="modal-buttons">
              <button onClick={handleDeleteCharacter} className="confirm-delete">
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSelect;