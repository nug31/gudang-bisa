import React, { useState, useEffect } from 'react';
import { Box, Button, Container, FormControl, InputLabel, MenuItem, Select, Typography, Paper, Alert, CircularProgress, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi, requestDbApi } from '../services/api';
import { InventoryItem, ItemRequest } from '../types';

const TestRequestPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ItemRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Fetch inventory items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const fetchedItems = await inventoryApi.getAll();
        setItems(fetchedItems);
        if (fetchedItems.length > 0) {
          setSelectedItemId(fetchedItems[0].id);
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error);
        setError('Failed to load inventory items. Please try again later.');
      }
    };

    fetchItems();
  }, []);

  // Fetch recent requests
  const fetchRecentRequests = async () => {
    if (!user) return;
    
    setLoadingRequests(true);
    try {
      const requests = await requestDbApi.getAll(user.id);
      setRecentRequests(requests);
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentRequests();
    }
  }, [user]);

  const handleItemChange = (event: any) => {
    setSelectedItemId(event.target.value);
  };

  const handleCreateTestRequest = async () => {
    if (!user) {
      setError('You must be logged in to create a request');
      return;
    }

    if (!selectedItemId) {
      setError('Please select an item');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Creating test request with item ID:', selectedItemId);
      
      // Create a simple test request
      const newRequest = {
        userId: user.id,
        itemId: selectedItemId,
        inventoryItemId: selectedItemId, // Include both for compatibility
        quantity: 1,
        title: `Test Request ${new Date().toLocaleTimeString()}`,
        description: `This is a test request created at ${new Date().toLocaleString()}`,
        reason: `Testing the request functionality at ${new Date().toLocaleString()}`,
        priority: 'medium',
        status: 'pending',
      };

      console.log('Test request data:', newRequest);
      
      // Create the request
      const createdRequest = await requestDbApi.create(newRequest);
      
      console.log('Test request created successfully:', createdRequest);
      setSuccess(`Request created successfully with ID: ${createdRequest.id}`);
      
      // Refresh the recent requests list
      fetchRecentRequests();
    } catch (error: any) {
      console.error('Error creating test request:', error);
      setError(`Failed to create request: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Test Request Creation
        </Typography>
        <Typography variant="body1" paragraph>
          This page allows you to test the request creation functionality with minimal input.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="item-select-label">Select Item</InputLabel>
          <Select
            labelId="item-select-label"
            value={selectedItemId}
            label="Select Item"
            onChange={handleItemChange}
            disabled={loading || items.length === 0}
          >
            {items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTestRequest}
          disabled={loading || !selectedItemId || !user}
          fullWidth
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Test Request'}
        </Button>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Requests
        </Typography>
        
        {loadingRequests ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : recentRequests.length > 0 ? (
          recentRequests.map((request) => (
            <Paper key={request.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6">{request.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {request.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {request.status}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {request.description}
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary">
            No recent requests found.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default TestRequestPage;
