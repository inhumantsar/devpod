import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  HStack,
  Heading,
  Icon,
  IconButton,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react"
import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { HiPencil } from "react-icons/hi2"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { IconTag } from "../../components"
import { useWorkspaces } from "../../contexts"
import { ProviderPlaceholder, Stack3D, Trash } from "../../icons"
import { exists } from "../../lib"
import { Routes } from "../../routes"
import { TProvider, TProviderID, TRunnable, TWithProviderID } from "../../types"
import { client } from "../../client"
import { QueryKeys } from "../../queryKeys"

type TProviderCardProps = {
  id: string
  provider: TProvider
  remove: TRunnable<TWithProviderID> &
    Pick<UseMutationResult, "status" | "error"> & { target: TWithProviderID | undefined }
}

export function ProviderCard({ id, provider, remove }: TProviderCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workspaces = useWorkspaces()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const providerWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.provider?.name === id),
    [id, workspaces]
  )
  const { mutate: updateDefaultProvider } = useMutation<
    void,
    unknown,
    Readonly<{ providerID: TProviderID }>
  >({
    mutationFn: async ({ providerID }) => {
      ;(await client.providers.useProvider(providerID)).unwrap()
    },
    onSettled: () => {
      queryClient.invalidateQueries(QueryKeys.PROVIDERS)
    },
  })

  const providerIcon = provider.config?.icon
  const isDefaultProvider = provider.default ?? false
  const providerVersion = provider.config?.version

  return (
    <>
      <Card variant="outline" width="72" height="96" overflow="hidden">
        <Box
          width="full"
          height="2"
          bgGradient={
            isDefaultProvider ? "linear(to-r, primary.400 30%, primary.500)" : "transparent"
          }
        />
        <CardHeader display="flex" justifyContent="center" padding="0">
          {exists(providerIcon) ? (
            <Image
              objectFit="cover"
              padding="4"
              borderRadius="md"
              height="44"
              src={providerIcon}
              alt="Provider Image"
            />
          ) : (
            <Center height="44">
              <ProviderPlaceholder boxSize={24} color="chakra-body-text" />
            </Center>
          )}
        </CardHeader>
        <CardBody>
          <Heading size="md">
            <Link as={RouterLink} to={Routes.toProvider(id)}>
              {id}
            </Link>
          </Heading>
          {providerVersion && (
            <Text fontFamily="monospace" color="gray.600" fontSize="sm" fontWeight="regular">
              {providerVersion}
            </Text>
          )}
          <HStack rowGap={2} marginTop={4} flexWrap="nowrap" alignItems="center">
            <IconTag
              icon={<Stack3D />}
              label={
                providerWorkspaces.length === 1
                  ? "1 workspace"
                  : providerWorkspaces.length > 0
                  ? providerWorkspaces.length + " workspaces"
                  : "No workspaces"
              }
              infoText={`This provider is used by ${providerWorkspaces.length} ${
                providerWorkspaces.length === 1 ? "workspace" : "workspaces"
              }`}
            />
          </HStack>
        </CardBody>
        <CardFooter justify="space-between">
          <HStack>
            <Switch
              isDisabled={isDefaultProvider}
              isChecked={isDefaultProvider}
              onChange={(e) => {
                if (e.target.checked) {
                  updateDefaultProvider({ providerID: id })
                }
              }}
            />
            <Text fontSize="sm" color="gray.700">
              Default
            </Text>
          </HStack>
          <ButtonGroup>
            <Tooltip label="Edit Provider">
              <IconButton
                aria-label="Edit Provider"
                variant="ghost"
                onClick={() => navigate(Routes.toProvider(id))}
                isLoading={false}
                icon={<Icon as={HiPencil} boxSize="4" />}
              />
            </Tooltip>
            <Tooltip label="Delete Provider">
              <IconButton
                aria-label="Delete Provider"
                variant="ghost"
                colorScheme="gray"
                icon={<Trash boxSize="4" />}
                onClick={() => {
                  onDeleteOpen()
                }}
                isLoading={remove.status === "loading" && remove.target?.providerID === id}
              />
            </Tooltip>
          </ButtonGroup>
        </CardFooter>
      </Card>

      <Modal onClose={onDeleteClose} isOpen={isDeleteOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Provider</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {providerWorkspaces.length === 0 ? (
              <>
                Deleting the provider will erase all provider state. Make sure to delete provider
                workspaces before. Are you sure you want to delete provider {id}?
              </>
            ) : (
              <>
                Please make sure to delete all workspaces that use this provider, before deleting
                this provider itself
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={"2"}>
              <Button onClick={onDeleteClose}>Close</Button>
              {!providerWorkspaces.length && (
                <Button
                  colorScheme={"red"}
                  onClick={async () => {
                    remove.run({ providerID: id })
                    onDeleteClose()
                  }}>
                  Delete
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
